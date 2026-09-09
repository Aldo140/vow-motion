import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, rows, transaction } from "@/lib/db";
import {
  currentUser,
  requireUser,
  requireAdmin,
  session,
  passwordHash,
  passwordMatches,
  hash,
  id,
  access,
  audit,
  rateLimit,
  sameOrigin,
  HttpError,
} from "@/lib/auth";
import { createDemo, createWedding, issueToken } from "@/lib/seed";
import { guestData, studioData } from "@/lib/data";
import {
  guestSchema,
  eventSchema,
  schemas,
  csvCell,
  escapeIcs,
  worldSchema,
  weddingUpdatesSchema,
} from "@/lib/validation";
import { deliver, checkout } from "@/lib/providers";
import { studioMessagesAction } from "@/lib/studio-messages-api";
import { sendInvitationCampaign } from "@/lib/invitation-campaign";
import { listWeddings } from "@/lib/wedding-access";
import { randomInt } from "node:crypto";
import {
  savePhoto,
  readPhoto,
  deletePhoto,
  savePublicMedia,
} from "@/lib/photo-storage";
import { listSocialPosts } from "@/lib/social";
import { readJson } from "@/lib/request-body";
import sharp from "sharp";
import QRCode from "qrcode";
import { pilotAction } from "@/lib/pilot-api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function handler(request: NextRequest, context: Context) {
  try {
    const parts = (await context.params).path;
    const [area, action, item] = parts;
    const method = request.method;
    if (method !== "GET") sameOrigin(request);
    const body = () => readJson(request, 2_000_000);
    if (area === "auth")
      throw new HttpError(404, "This account action is unavailable.");
    if (area === "demo" && method === "POST") {
      await rateLimit("demo:" + request.headers.get("x-forwarded-for"), 30);
      const existing = await currentUser();
      if (!existing) await session(await createDemo());
      return json({ ok: true });
    }
    if (area === "admin") {
      const admin = await requireAdmin();
      if (action === "role" && method === "POST") {
        const input = z
          .object({ user_id: z.string(), is_admin: z.boolean() })
          .parse(await body());
        if (input.user_id === admin.id)
          throw new HttpError(400, "You cannot change your own access.");
        const updated = await (
          await db()
        ).query(
          "UPDATE users SET is_admin=$1 WHERE id=$2 AND is_demo=false RETURNING id",
          [input.is_admin, input.user_id],
        );
        if (!updated.rows.length)
          throw new HttpError(404, "Account not found.");
        return json({ ok: true });
      }
      if (action === "media" && method === "POST") {
        if (Number(request.headers.get("content-length") || 0) > 105_000_000)
          throw new HttpError(413, "Keep media under 100 MB.");
        const form = await request.formData();
        const file = form.get("file");
        const allowed = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "video/quicktime",
        ];
        if (!(file instanceof File) || !allowed.includes(file.type))
          throw new HttpError(400, "Use a JPG, PNG, WebP, or MP4/MOV file.");
        const kind = file.type.startsWith("video") ? "video" : "image";
        let bytes = Buffer.from(await file.arrayBuffer());
        if (kind === "image")
          bytes = await sharp(bytes, { limitInputPixels: 100_000_000 })
            .rotate()
            .resize(1440, 1800, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 88 })
            .toBuffer();
        const url = await savePublicMedia(
          `${id()}.${kind === "video" ? "mp4" : "jpg"}`,
          bytes,
          kind === "video" ? "video/mp4" : "image/jpeg",
        );
        return json({ url, type: kind });
      }
      if (action === "social") {
        const media = z
          .array(
            z.object({
              url: z.url(),
              type: z.enum(["image", "video"]),
            }),
          )
          .max(10);
        const fields = z.object({
          caption: z.string().max(2200).default(""),
          media: media.default([]),
          kind: z.enum(["image", "carousel", "reel"]).default("image"),
          status: z.enum(["draft", "scheduled", "canceled"]).optional(),
          scheduled_at: z.iso.datetime({ offset: true }).nullable().optional(),
        });
        if (method === "GET") return json(await listSocialPosts());
        if (method === "POST") {
          const input = fields.parse(await body());
          await (
            await db()
          ).query(
            `INSERT INTO social_posts(id,caption,media,kind,status,scheduled_at,created_by)
             VALUES($1,$2,$3::jsonb,$4,$5,$6,$7)`,
            [
              id(),
              input.caption,
              JSON.stringify(input.media),
              input.kind,
              input.status === "scheduled" && input.scheduled_at
                ? "scheduled"
                : "draft",
              input.scheduled_at ?? null,
              admin.id,
            ],
          );
          return json({ ok: true });
        }
        if (method === "PATCH" && item) {
          const input = fields.partial().parse(await body());
          const current = (
            await rows<{ status: string; scheduled_at: string | null }>(
              "SELECT status, scheduled_at FROM social_posts WHERE id=$1",
              [item],
            )
          )[0];
          if (!current) throw new HttpError(404, "Post not found.");
          if (current.status === "publishing" || current.status === "posted")
            throw new HttpError(409, "That post can no longer be edited.");
          const scheduledAt =
            input.scheduled_at !== undefined
              ? input.scheduled_at
              : current.scheduled_at;
          const status = input.status ?? current.status;
          if (status === "scheduled" && !scheduledAt)
            throw new HttpError(400, "Pick a date and time to schedule.");
          const sets: string[] = ["updated_at=now()", "attempts=0", "error=NULL"];
          const values: unknown[] = [];
          const set = (col: string, value: unknown) => {
            values.push(value);
            sets.push(`${col}=$${values.length}`);
          };
          if (input.caption !== undefined) set("caption", input.caption);
          if (input.kind !== undefined) set("kind", input.kind);
          if (input.media !== undefined) {
            values.push(JSON.stringify(input.media));
            sets.push(`media=$${values.length}::jsonb`);
          }
          set("scheduled_at", scheduledAt ?? null);
          set(
            "status",
            status === "scheduled"
              ? "scheduled"
              : status === "canceled"
                ? "canceled"
                : "draft",
          );
          values.push(item);
          await (
            await db()
          ).query(
            `UPDATE social_posts SET ${sets.join(",")} WHERE id=$${values.length}`,
            values,
          );
          return json({ ok: true });
        }
        if (method === "DELETE" && item) {
          await (
            await db()
          ).query(
            "DELETE FROM social_posts WHERE id=$1 AND status<>'publishing'",
            [item],
          );
          return json({ ok: true });
        }
      }
      throw new HttpError(404, "This action is unavailable.");
    }
    if (area === "weddings") {
      const user = await requireUser();
      if (method === "GET") return json(await listWeddings(user.id));
      const input = z
        .object({
          names: z.string().min(3).max(150),
          date: z.iso.date(),
          location: z.string().min(2).max(200),
          world: worldSchema,
          timezone: z
            .string()
            .refine((v) => {
              try {
                new Intl.DateTimeFormat("en", { timeZone: v });
                return true;
              } catch {
                return false;
              }
            }, "Choose a valid timezone.")
            .default("Europe/Rome"),
        })
        .parse(await body());
      const weddingId = await createWedding(user.id, input);
      return json({ id: weddingId });
    }
    if (area === "studio") {
      const weddingId = request.nextUrl.searchParams.get("wedding");
      if (!weddingId) throw new HttpError(400, "Choose a wedding.");
      const { user, role } = await access(weddingId, method !== "GET");
      if (!action && method === "GET") return json(await studioData(weddingId));
      if (
        ["identity", "setup", "publish", "feedback", "requests"].includes(
          action,
        )
      ) {
        if (method === "GET")
          throw new HttpError(405, "This action is unavailable.");
        return json(
          await pilotAction(
            action,
            item,
            method,
            weddingId,
            user.id,
            role,
            await body(),
          ),
        );
      }
      if (action === "export") {
        const data = await studioData(weddingId);
        const sheet = request.nextUrl.searchParams.get("sheet") ?? "guests";
        const table = (guest: { table_name?: string | null }) =>
          guest.table_name || "Not yet seated";
        const download = (name: string, rows: unknown[][]) =>
          new NextResponse(
            rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
            {
              headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${name}.csv"`,
                "Cache-Control": "no-store",
              },
            },
          );

        // The documents a planner otherwise rebuilds by hand the week before.
        if (sheet === "kitchen") {
          const attending = data.guests.filter((g) => g.status === "attending");
          const meals = [
            ...new Set(attending.map((g) => g.meal || "Not chosen")),
          ].sort();
          const counts: unknown[][] = [
            ["Kitchen sheet", data.wedding.names, data.wedding.date],
            [],
            ["Meal", "Covers"],
            ...meals.map((meal) => [
              meal,
              attending.filter((g) => (g.meal || "Not chosen") === meal).length,
            ]),
            ["Total covers", attending.length],
            [],
            ["Dietary requirements", "", "", ""],
            ["Guest", "Table", "Meal", "Requirement"],
            ...attending
              .filter((g) => g.dietary)
              .sort((a, b) => table(a).localeCompare(table(b)))
              .map((g) => [g.name, table(g), g.meal, g.dietary]),
            [],
            ["Covers by table", ""],
            ["Table", "Covers"],
            ...data.tables.map((t) => [
              t.name,
              attending.filter((g) => g.table_name === t.name).length,
            ]),
          ];
          return download("kitchen-sheet", counts);
        }

        if (sheet === "shuttle") {
          // Shuttle answers are stored against the question's own id.
          const question = data.questions.find((q) =>
            /shuttle|transport|coach|bus/i.test(q.label),
          );
          const riders = question
            ? await rows<{ name: string; household: string; answer: string }>(
                `SELECT DISTINCT g.name, h.name household, r.answers->>$2 answer
                 FROM guest_event_responses r
                 JOIN guests g ON g.id=r.guest_id
                 JOIN households h ON h.id=g.household_id
                 WHERE g.wedding_id=$1 AND r.attending=true
                   AND COALESCE(r.answers->>$2,'') <> ''
                   AND r.answers->>$2 NOT ILIKE 'no%'
                 ORDER BY h.name, g.name`,
                [weddingId, question.id],
              )
            : [];
          return download("shuttle-manifest", [
            ["Shuttle manifest", data.wedding.names, data.wedding.date],
            [question?.label ?? "No shuttle question has been asked", ""],
            [],
            ["Guest", "Household", "Answer"],
            ...riders.map((r) => [r.name, r.household, r.answer]),
            [],
            ["Seats required", riders.length],
          ]);
        }

        if (sheet === "placecards") {
          const attending = [...data.guests]
            .filter((g) => g.status === "attending")
            .sort((a, b) => a.name.localeCompare(b.name));
          return download("place-cards", [
            ["Place cards", data.wedding.names, data.wedding.date],
            [],
            ["Guest", "Table", "Meal", "Dietary"],
            ...attending.map((g) => [g.name, table(g), g.meal, g.dietary]),
          ]);
        }

        const header = [
          "Name",
          "Email",
          "Phone",
          "Address",
          "Household",
          "Tags",
          "RSVP",
          "Meal",
          "Dietary needs",
          "Table",
        ];
        const lines = data.guests.map((g) => [
          g.name,
          g.email,
          g.phone,
          g.address,
          data.households.find((h) => h.id === g.household_id)?.name,
          g.tags,
          g.status,
          g.meal,
          g.dietary,
          g.table_name,
        ]);
        return new NextResponse(
          [header, ...lines].map((r) => r.map(csvCell).join(",")).join("\r\n"),
          {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition":
                'attachment; filename="wedding-guests.csv"',
              "Cache-Control": "no-store",
            },
          },
        );
      }
      if (
        (action === "invitations" || action === "preview") &&
        method === "POST"
      ) {
        const input = z
          .object({ household_id: z.string(), revoke: z.boolean().optional() })
          .parse(await body());
        if (
          !(
            await rows(
              "SELECT id FROM households WHERE id=$1 AND wedding_id=$2",
              [input.household_id, weddingId],
            )
          ).length
        )
          throw new HttpError(404, "Household not found.");
        if (input.revoke && action !== "preview")
          await (
            await db()
          ).query(
            "UPDATE invitation_tokens SET revoked=true WHERE household_id=$1",
            [input.household_id],
          );
        const raw = await issueToken(
          weddingId,
          input.household_id,
          action === "preview",
        );
        if (action !== "preview")
          await audit(weddingId, user.id, "Personal invitation link created");
        return json({
          url: `${process.env.APP_URL || new URL(request.url).protocol + "//" + request.headers.get("host")}/i/${raw}`,
        });
      }
      if (action === "guests" && method === "POST") {
        const input = await body();
        const guests = z
          .array(guestSchema)
          .min(1)
          .max(1000)
          .parse(Array.isArray(input) ? input : [input]);
        const added = await transaction(async (c) => {
          const result = [];
          for (const guest of guests) {
            let householdId = guest.household_id;
            if (householdId) {
              if (
                !(
                  await c.query(
                    "SELECT id FROM households WHERE id=$1 AND wedding_id=$2",
                    [householdId, weddingId],
                  )
                ).rows.length
              )
                throw new HttpError(400, "Invalid household.");
            } else {
              const existing = guest.household
                ? (
                    await c.query<{ id: string }>(
                      "SELECT id FROM households WHERE wedding_id=$1 AND name=$2",
                      [weddingId, guest.household],
                    )
                  ).rows[0]
                : null;
              householdId = existing?.id || id();
              if (!existing)
                await c.query(
                  "INSERT INTO households(id,wedding_id,name) VALUES($1,$2,$3)",
                  [
                    householdId,
                    weddingId,
                    guest.household || guest.name + " household",
                  ],
                );
            }
            const guestId = id();
            await c.query(
              "INSERT INTO guests(id,wedding_id,household_id,name,email,phone,address,language,tags,notes,is_plus_one,consent) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
              [
                guestId,
                weddingId,
                householdId,
                guest.name,
                guest.email,
                guest.phone,
                guest.address,
                guest.language,
                guest.tags,
                guest.notes,
                guest.is_plus_one,
                guest.consent,
              ],
            );
            result.push(guestId);
          }
          return result;
        });
        await audit(
          weddingId,
          user.id,
          `${added.length} guest${added.length === 1 ? "" : "s"} added`,
        );
        return json({ added: added.length });
      }
      if (action === "guests" && method === "PATCH") {
        const input = guestSchema.parse(await body());
        const result = await (
          await db()
        ).query(
          // A guest who unsubscribed stays unsubscribed. Consent is a plain
          // boolean that the couple's own edit rewrites wholesale, so without
          // this guard re-saving a guest — or re-importing the spreadsheet they
          // came from — silently resurrects a withdrawal the guest made
          // deliberately. `unsubscribed_at` is the durable record of that.
          "UPDATE guests SET name=$1,email=$2,phone=$3,address=$4,language=$5,tags=$6,notes=$7,consent=($8 AND unsubscribed_at IS NULL) WHERE id=$9 AND wedding_id=$10 RETURNING id",
          [
            input.name,
            input.email,
            input.phone,
            input.address,
            input.language,
            input.tags,
            input.notes,
            input.consent,
            item,
            weddingId,
          ],
        );
        if (!result.rows.length) throw new HttpError(404, "Guest not found.");
        return json({ ok: true });
      }
      if (action === "guests" && method === "DELETE") {
        await (
          await db()
        ).query("DELETE FROM guests WHERE id=$1 AND wedding_id=$2", [
          item,
          weddingId,
        ]);
        await audit(weddingId, user.id, "Guest removed");
        return json({ ok: true });
      }
      if (action === "events" && (method === "POST" || method === "PATCH")) {
        const input = eventSchema.parse(await body());
        const eventId = item || id();
        await transaction(async (c) => {
          if (
            item &&
            !(
              await c.query(
                "SELECT id FROM events WHERE id=$1 AND wedding_id=$2",
                [item, weddingId],
              )
            ).rows.length
          )
            throw new HttpError(404, "Event not found.");
          for (const householdId of input.household_ids)
            if (
              !(
                await c.query(
                  "SELECT id FROM households WHERE id=$1 AND wedding_id=$2",
                  [householdId, weddingId],
                )
              ).rows.length
            )
              throw new HttpError(400, "Invalid household.");
          const { household_ids, ...fields } = input;
          const keys = Object.keys(fields),
            values = Object.values(fields);
          if (item)
            await c.query(
              `UPDATE events SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(",")} WHERE id=$${keys.length + 1} AND wedding_id=$${keys.length + 2}`,
              [...values, item, weddingId],
            );
          else
            await c.query(
              `INSERT INTO events(id,wedding_id,${keys.join(",")}) VALUES(${Array.from({ length: keys.length + 2 }, (_, i) => "$" + (i + 1)).join(",")})`,
              [eventId, weddingId, ...values],
            );
          await c.query("DELETE FROM event_guest_access WHERE event_id=$1", [
            eventId,
          ]);
          for (const h of household_ids)
            await c.query(
              "INSERT INTO event_guest_access(event_id,household_id) VALUES($1,$2)",
              [eventId, h],
            );
        });
        await audit(
          weddingId,
          user.id,
          `Event ${item ? "updated" : "created"}: ${input.title}`,
        );
        return json({ ok: true });
      }
      if (action === "events" && method === "DELETE") {
        await (
          await db()
        ).query("DELETE FROM events WHERE id=$1 AND wedding_id=$2", [
          item,
          weddingId,
        ]);
        return json({ ok: true });
      }
      if (action === "settings" && method === "PATCH") {
        const input = z
          .object({
            names: z.string().min(3).max(150),
            date: z.iso.date(),
            location: z.string().min(2).max(200),
            timezone: z.string().refine((v) => {
              try {
                new Intl.DateTimeFormat("en", { timeZone: v });
                return true;
              } catch {
                return false;
              }
            }, "Choose a valid timezone."),
            world: worldSchema,
            opening: z.enum(["envelope", "seal"]),
            story: z.string().max(10000),
            privacy: z.enum(["public", "invite-only", "password"]),
            password: z.string().min(8).max(200).optional(),
            locale: z.enum(["en", "es"]),
            status: z.enum(["draft", "published", "memories"]),
            rsvp_deadline: z.iso.date(),
            settings: z.record(z.string(), z.unknown()).optional(),
          })
          .parse(await body());
        if (input.privacy === "password" && !input.password) {
          const current = (
            await rows("SELECT password_hash FROM weddings WHERE id=$1", [
              weddingId,
            ])
          )[0];
          if (!current.password_hash)
            throw new HttpError(
              400,
              "Set a password with at least 8 characters.",
            );
        }
        if (!["owner", "partner"].includes(role)) {
          const before = (
            await rows("SELECT * FROM weddings WHERE id=$1", [weddingId])
          )[0];
          if (
            input.password ||
            ["privacy", "status", "rsvp_deadline"].some(
              (k) => input[k as keyof typeof input] !== before[k],
            )
          )
            throw new HttpError(
              403,
              "Only the couple can change publishing and privacy settings.",
            );
        }
        const { password, ...fields } = input;
        const record: Record<string, unknown> = { ...fields };
        const hasDesign =
          (
            await rows(
              "SELECT wedding_id FROM wedding_designs WHERE wedding_id=$1",
              [weddingId],
            )
          ).length > 0;
        if (hasDesign) {
          delete record.world;
          delete record.opening;
          delete record.story;
          if (record.settings) {
            const settings = {
              ...(record.settings as Record<string, unknown>),
            };
            delete settings.media;
            delete settings.identity;
            record.settings = settings;
          }
        }
        if (password) record.password_hash = passwordHash(password);
        if (record.settings) record.settings = JSON.stringify(record.settings);
        const keys = Object.keys(record);
        await (
          await db()
        ).query(
          `UPDATE weddings SET ${keys.map((k, i) => (k === "settings" ? `settings=COALESCE(settings,'{}'::jsonb) || $${i + 1}::jsonb` : `${k}=$${i + 1}`)).join(",")} WHERE id=$${keys.length + 1}`,
          [...Object.values(record), weddingId],
        );
        await audit(weddingId, user.id, "Wedding experience settings saved");
        return json({ ok: true });
      }
      if (action === "seating" && method === "POST") {
        const input = z
          .object({ guest_id: z.string(), table_id: z.string().nullable() })
          .parse(await body());
        await transaction(async (c) => {
          if (
            !(
              await c.query(
                "SELECT id FROM guests WHERE id=$1 AND wedding_id=$2 AND status='attending'",
                [input.guest_id, weddingId],
              )
            ).rows.length
          )
            throw new HttpError(400, "Only attending guests can be seated.");
          if (!input.table_id) {
            await c.query("DELETE FROM seat_assignments WHERE guest_id=$1", [
              input.guest_id,
            ]);
            return;
          }
          const table = (
            await c.query<{ capacity: number }>(
              "SELECT capacity FROM seating_tables WHERE id=$1 AND wedding_id=$2 FOR UPDATE",
              [input.table_id, weddingId],
            )
          ).rows[0];
          if (!table) throw new HttpError(404, "Table not found.");
          const count = (
            await c.query<{ count: string }>(
              "SELECT count(*) FROM seat_assignments WHERE table_id=$1 AND guest_id<>$2",
              [input.table_id, input.guest_id],
            )
          ).rows[0];
          if (Number(count.count) >= table.capacity)
            throw new HttpError(
              409,
              "This table is full. Choose another table.",
            );
          await c.query(
            "INSERT INTO seat_assignments(guest_id,table_id) VALUES($1,$2) ON CONFLICT(guest_id) DO UPDATE SET table_id=$2",
            [input.guest_id, input.table_id],
          );
        });
        return json({ ok: true });
      }
      const messageAction = await studioMessagesAction({
        action,
        item,
        method,
        weddingId,
        userId: user.id,
        demo: user.is_demo,
        readBody: body,
      });
      if (messageAction.handled) return json(messageAction.value);
      if (action === "invitation-campaign" && method === "POST") {
        return json(
          await sendInvitationCampaign({
            weddingId,
            actorId: user.id,
            actorEmail: user.email,
            demo: user.is_demo,
            origin:
              process.env.APP_URL ||
              new URL(request.url).protocol +
                "//" +
                request.headers.get("host"),
            value: await body(),
          }),
        );
      }
      if (action === "photos" && method === "PATCH") {
        const input = z.object({ approved: z.boolean() }).parse(await body());
        await (
          await db()
        ).query("UPDATE photos SET approved=$1 WHERE id=$2 AND wedding_id=$3", [
          input.approved,
          item,
          weddingId,
        ]);
        return json({ ok: true });
      }
      if (action === "photos" && method === "DELETE") {
        const photo = (
          await rows(
            "SELECT filename FROM photos WHERE id=$1 AND wedding_id=$2",
            [item, weddingId],
          )
        )[0];
        if (!photo) throw new HttpError(404, "Photo not found.");
        await deletePhoto(String(photo.filename));
        await (
          await db()
        ).query("DELETE FROM photos WHERE id=$1 AND wedding_id=$2", [
          item,
          weddingId,
        ]);
        return json({ ok: true });
      }
      if (action === "checkout" && method === "POST") {
        const { plan } = z
          .object({ plan: z.enum(["essential", "signature", "bespoke"]) })
          .parse(await body());
        return json({ url: await checkout(plan, weddingId, user.email) });
      }
      const tableMap: Record<string, string> = {
        travel: "travel_items",
        registry: "registry_links",
        faqs: "faqs",
        questions: "rsvp_questions",
        tables: "seating_tables",
        collaborators: "collaborators",
        domains: "domains",
      };
      if (action in tableMap) {
        if (
          ["collaborators", "domains"].includes(action) &&
          !["owner", "partner"].includes(role)
        )
          throw new HttpError(403, "Only the couple can manage this setting.");
        const table = tableMap[action];
        if (method === "DELETE") {
          await (
            await db()
          ).query(`DELETE FROM ${table} WHERE id=$1 AND wedding_id=$2`, [
            item,
            weddingId,
          ]);
          return json({ ok: true });
        }
        if (
          method === "PATCH" &&
          item &&
          ["travel", "registry", "faqs"].includes(action)
        ) {
          const fields = schemas[
            action as "travel" | "registry" | "faqs"
          ].parse(await body());
          const keys = Object.keys(fields);
          const updated = await (
            await db()
          ).query(
            `UPDATE ${table} SET ${keys.map((key, index) => `${key}=$${index + 1}`).join(",")} WHERE id=$${keys.length + 1} AND wedding_id=$${keys.length + 2} RETURNING id`,
            [...Object.values(fields), item, weddingId],
          );
          if (!updated.rows.length)
            throw new HttpError(
              404,
              "This detail could not be found. Refresh and try again.",
            );
          await audit(weddingId, user.id, `${action} updated`);
          return json({ ok: true });
        }
        if (method === "POST") {
          const schema = schemas[action as keyof typeof schemas];
          const fields = schema.parse(await body());
          const keys = Object.keys(fields),
            values = Object.values(fields).map((v) =>
              Array.isArray(v) ? JSON.stringify(v) : v,
            );
          await (
            await db()
          ).query(
            `INSERT INTO ${table}(id,wedding_id,${keys.join(",")}) VALUES(${Array.from({ length: keys.length + 2 }, (_, i) => "$" + (i + 1)).join(",")})`,
            [id(), weddingId, ...values],
          );
          await audit(weddingId, user.id, `${action} updated`);
          return json({ ok: true });
        }
      }
    }
    if (area === "guest") {
      const raw = request.nextUrl.searchParams.get("token") || "";
      const data = await guestData(raw);
      const weddingId = data.wedding.id;
      if (data.preview && method !== "GET")
        throw new HttpError(
          403,
          "This is a preview. Guest information cannot be changed.",
        );
      if (action === "requests" && method === "POST") {
        await rateLimit("guest-question:" + hash(raw), 20);
        const { question } = z
          .object({ question: z.string().trim().min(5).max(2000) })
          .parse(await body());
        await (
          await db()
        ).query(
          "INSERT INTO guest_requests(id,wedding_id,household_id,question) VALUES($1,$2,$3,$4)",
          [id(), weddingId, data.guests[0].household_id, question],
        );
        return json({ ok: true });
      }
      if (!action && method === "GET") {
        await (
          await db()
        ).query(
          "UPDATE invitation_tokens SET opened_at=COALESCE(opened_at,now()) WHERE token_hash=$1 AND preview=false",
          [hash(raw)],
        );
        return json(data);
      }
      if (action === "rsvp" && method === "POST") {
        await rateLimit("rsvp:" + hash(raw), 100);
        if (
          data.wedding.rsvp_deadline <
          new Intl.DateTimeFormat("en-CA", {
            timeZone: data.wedding.timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date())
        )
          throw new HttpError(
            403,
            "The RSVP deadline has passed. Please contact your hosts.",
          );
        const input = z
          .object({
            responses: z
              .array(
                z.object({
                  guest_id: z.string(),
                  event_id: z.string(),
                  attending: z.boolean(),
                  meal: z.string().max(200).default(""),
                  dietary: z.string().max(1000).default(""),
                  name: z.string().max(150).optional(),
                  answers: z
                    .record(z.string(), z.string().max(1000))
                    .default({}),
                }),
              )
              .max(200),
            contacts: z.array(weddingUpdatesSchema).max(200).optional(),
          })
          .parse(await body());
        if (
          input.contacts &&
          (new Set(input.contacts.map((c) => c.guest_id)).size !==
            input.contacts.length ||
            input.contacts.some(
              (c) => !data.guests.some((g) => g.id === c.guest_id),
            ))
        )
          throw new HttpError(
            403,
            "These contact details are not part of your invitation.",
          );
        const expected =
          data.guests.length *
          data.events.filter((e) => e.rsvp_required).length;
        const unique = new Set(
          input.responses.map((r) => r.guest_id + ":" + r.event_id),
        );
        if (
          unique.size !== input.responses.length ||
          input.responses.length !== expected
        )
          throw new HttpError(
            400,
            "Please answer for every invited guest and event.",
          );
        for (const response of input.responses) {
          if (
            !data.guests.some((g) => g.id === response.guest_id) ||
            !data.events.some(
              (e) => e.id === response.event_id && e.rsvp_required,
            )
          )
            throw new HttpError(
              403,
              "This response is not part of your invitation.",
            );
          if (response.attending && !response.meal)
            throw new HttpError(
              400,
              "Please choose a meal for every attending guest.",
            );
          for (const q of data.questions) {
            if (
              q.required &&
              (q.condition === "always" || response.attending) &&
              !response.answers[q.id]?.trim()
            )
              throw new HttpError(400, `Please answer: ${q.label}`);
          }
        }
        await transaction(async (c) => {
          const eventIds = [
            ...new Set(input.responses.map((r) => r.event_id)),
          ].sort();
          const locked = await c.query<{ id: string; capacity: number }>(
            "SELECT id,capacity FROM events WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE",
            [eventIds],
          );
          const active = await c.query(
            "SELECT id FROM invitation_tokens WHERE token_hash=$1 AND revoked=false AND expires_at>now()",
            [hash(raw)],
          );
          if (!active.rows.length)
            throw new HttpError(
              403,
              "Your invitation changed. Please reopen it.",
            );
          for (const event of locked.rows) {
            const allowed = await c.query(
              "SELECT id FROM events WHERE id=$1 AND (visibility='all' OR EXISTS(SELECT 1 FROM event_guest_access WHERE event_id=$1 AND household_id=$2))",
              [event.id, data.guests[0].household_id],
            );
            if (!allowed.rows.length)
              throw new HttpError(
                403,
                "Your event invitation changed. Please reopen it.",
              );
          }
          for (const r of input.responses) {
            await c.query(
              "INSERT INTO guest_event_responses(guest_id,event_id,attending,meal,dietary,answers) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(guest_id,event_id) DO UPDATE SET attending=$3,meal=$4,dietary=$5,answers=$6,updated_at=now()",
              [
                r.guest_id,
                r.event_id,
                r.attending,
                r.attending ? r.meal : "",
                r.attending ? r.dietary : "",
                JSON.stringify(r.answers),
              ],
            );
            if (
              r.name &&
              data.guests.find((g) => g.id === r.guest_id)?.is_plus_one
            )
              await c.query("UPDATE guests SET name=$1 WHERE id=$2", [
                r.name,
                r.guest_id,
              ]);
          }
          for (const event of locked.rows) {
            const count = (
              await c.query<{ count: string }>(
                "SELECT count(*) FROM guest_event_responses WHERE event_id=$1 AND attending=true",
                [event.id],
              )
            ).rows[0];
            if (Number(count.count) > event.capacity)
              throw new HttpError(
                409,
                "This event has reached capacity. Please contact your hosts.",
              );
          }
          for (const g of data.guests) {
            const responses = input.responses.filter(
                (r) => r.guest_id === g.id,
              ),
              attending = responses.some((r) => r.attending),
              meal = responses.find((r) => r.attending)?.meal || "",
              dietary = responses.find((r) => r.attending)?.dietary || "";
            await c.query(
              "UPDATE guests SET status=$1,meal=$2,dietary=$3 WHERE id=$4",
              [attending ? "attending" : "declined", meal, dietary, g.id],
            );
            if (!attending)
              await c.query("DELETE FROM seat_assignments WHERE guest_id=$1", [
                g.id,
              ]);
          }
          for (const contact of input.contacts || []) {
            await c.query(
              // A previous unsubscribe survives a later RSVP edit; see above.
              "UPDATE guests SET email=$1,phone=$2,consent=($3 AND unsubscribed_at IS NULL) WHERE id=$4 AND household_id=$5",
              [
                contact.email,
                contact.phone,
                contact.consent,
                contact.guest_id,
                data.guests[0].household_id,
              ],
            );
          }
        });
        await audit(weddingId, "guest", `${data.household} saved their RSVP`);
        return json({ ok: true });
      }
      if (action === "contact" && method === "POST") {
        const input = weddingUpdatesSchema
          .safeExtend({
            address: z.string().max(500),
          })
          .parse(await body());
        if (!data.guests.some((g) => g.id === input.guest_id))
          throw new HttpError(403, "Guest not found.");
        await (
          await db()
        ).query(
          // A previous unsubscribe survives a later contact update; see above.
          "UPDATE guests SET email=$1,phone=$2,address=$3,consent=($4 AND unsubscribed_at IS NULL) WHERE id=$5",
          [
            input.email,
            input.phone,
            input.address,
            input.consent,
            input.guest_id,
          ],
        );
        return json({ ok: true });
      }
      if (action === "calendar") {
        const events = item
          ? data.events.filter((e) => e.id === item)
          : data.events;
        const stamp = (s: string) =>
          new Date(s)
            .toISOString()
            .replaceAll("-", "")
            .replaceAll(":", "")
            .replace(/\.\d{3}/, "");
        const content = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Vow Motion//Wedding//EN",
          ...events.flatMap((e) => [
            "BEGIN:VEVENT",
            `UID:${e.id}@vowmotion`,
            `DTSTAMP:${stamp(new Date().toISOString())}`,
            `DTSTART:${stamp(e.starts_at)}`,
            `DTEND:${stamp(e.ends_at)}`,
            `SUMMARY:${escapeIcs(e.title + " — " + data.wedding.names)}`,
            `LOCATION:${escapeIcs(e.venue + ", " + e.address)}`,
            "END:VEVENT",
          ]),
          "END:VCALENDAR",
        ].join("\r\n");
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'attachment; filename="our-wedding.ics"',
            "Cache-Control": "no-store",
          },
        });
      }
      if (action === "qr") {
        return new NextResponse(
          await QRCode.toString(
            `${process.env.APP_URL || new URL(request.url).protocol + "//" + request.headers.get("host")}/i/${raw}`,
            {
              type: "svg",
              margin: 2,
              color: { dark: "#292b23", light: "#ffffff" },
            },
          ),
          {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "no-store",
            },
          },
        );
      }
      if (action === "photos" && method === "POST") {
        await rateLimit("photo:" + hash(raw), 50);
        if (Number(request.headers.get("content-length") || 0) > 11_000_000)
          throw new HttpError(
            413,
            "Please choose an image smaller than 10 MB.",
          );
        const form = await request.formData();
        const file = form.get("file");
        if (
          !(file instanceof File) ||
          file.size > 10_000_000 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        )
          throw new HttpError(
            400,
            "Choose a JPG, PNG or WebP image under 10 MB.",
          );
        const bytes = await file.arrayBuffer();
        let output: Buffer;
        try {
          output = await sharp(Buffer.from(bytes), {
            limitInputPixels: 40_000_000,
          })
            .rotate()
            .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
        } catch {
          throw new HttpError(
            400,
            "We could not read that image. Please choose another.",
          );
        }
        const photoId = id();
        const filename = await savePhoto(weddingId, photoId, output);
        try {
          await (
            await db()
          ).query(
            "INSERT INTO photos(id,wedding_id,household_id,filename,caption) VALUES($1,$2,$3,$4,$5)",
            [
              photoId,
              weddingId,
              data.guests[0].household_id,
              filename,
              String(form.get("caption") || "").slice(0, 300),
            ],
          );
        } catch (error) {
          await deletePhoto(filename).catch(() => {});
          throw error;
        }
        return json({ ok: true });
      }
    }
    if (area === "photos" && method === "GET") {
      const photo = (
        await rows("SELECT * FROM photos WHERE id=$1", [action])
      )[0];
      if (!photo) throw new HttpError(404, "Photo not found.");
      const raw = request.nextUrl.searchParams.get("token");
      if (raw) {
        const data = await guestData(raw);
        if (!data.photos.some((p) => p.id === action))
          throw new HttpError(403, "Photo unavailable.");
      } else await access(String(photo.wedding_id));
      const bytes = await readPhoto(String(photo.filename));
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (area === "lookup" && method === "POST") {
      await rateLimit("lookup:" + request.headers.get("x-forwarded-for"), 20);
      const input = z
        .object({
          slug: z.string().optional(),
          name: z.string().min(2).optional(),
          email: z.email().optional(),
          challenge: z.string().optional(),
          code: z.string().length(6).optional(),
        })
        .parse(await body());
      if (input.challenge && input.code) {
        const challenge = (
          await rows(
            "UPDATE verification_challenges SET attempts=attempts+1 WHERE id=$1 AND consumed=false AND expires_at>now() AND attempts<5 RETURNING *",
            [input.challenge],
          )
        )[0];
        if (
          !challenge ||
          !passwordMatches(input.code, String(challenge.code_hash))
        )
          throw new HttpError(
            400,
            "That code is incorrect or expired. Request a new one.",
          );
        const consumed = await (
          await db()
        ).query(
          "UPDATE verification_challenges SET consumed=true WHERE id=$1 AND consumed=false RETURNING id",
          [input.challenge],
        );
        if (!consumed.rows.length)
          throw new HttpError(400, "That code has already been used.");
        return json({
          url:
            "/i/" +
            (await issueToken(
              String(challenge.wedding_id),
              String(challenge.household_id),
            )),
        });
      }
      if (!input.slug || !input.email || !input.name)
        throw new HttpError(400, "Enter your name and email address.");
      const guests = await rows(
        "SELECT g.*,w.id wid,u.is_demo FROM guests g JOIN weddings w ON w.id=g.wedding_id JOIN users u ON u.id=w.owner_id WHERE w.slug=$1 AND lower(g.email)=$2",
        [input.slug, input.email.toLowerCase()],
      );
      const normalize = (s: string) =>
        s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z]/g, "");
      const g = guests.find(
        (g) =>
          normalize(String(g.name)).includes(normalize(input.name!)) ||
          normalize(input.name!).includes(normalize(String(g.name))),
      );
      const challengeId = id();
      if (!g)
        return json({
          challenge: challengeId,
          message:
            "If your details match an invitation, a verification code will arrive by email.",
        });
      const code = String(randomInt(100000, 1000000));
      await (
        await db()
      ).query(
        "INSERT INTO verification_challenges(id,wedding_id,household_id,code_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')",
        [challengeId, g.wid, g.household_id, passwordHash(code)],
      );
      await deliver({
        channel: "email",
        to: String(g.email),
        subject: "Your wedding invitation code",
        body:
          "Your verification code is " + code + ". It expires in 10 minutes.",
        idempotencyKey: challengeId,
        demo: Boolean(g.is_demo),
      });
      const owner = await currentUser();
      const canPreview =
        !!owner &&
        Boolean(g.is_demo) &&
        (
          await rows("SELECT id FROM weddings WHERE id=$1 AND owner_id=$2", [
            g.wid,
            owner.id,
          ])
        ).length > 0;
      return json({
        challenge: challengeId,
        message:
          "If your details match an invitation, a verification code will arrive by email.",
        ...(canPreview ? { development_code: code } : {}),
      });
    }
    throw new HttpError(404, "This action is unavailable.");
  } catch (error) {
    if (error instanceof z.ZodError)
      return json({ error: error.issues.map((i) => i.message).join(" ") }, 400);
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    console.error(
      "Request failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return json(
      {
        error:
          "Something went wrong. Your saved data is safe. Please try again.",
      },
      500,
    );
  }
}
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
