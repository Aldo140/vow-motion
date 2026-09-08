import { NextRequest } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { access, hash, HttpError, id, rateLimit, sameOrigin } from "@/lib/auth";
import { db, rows, transaction } from "@/lib/db";
import { readJson } from "@/lib/request-body";
import { deletePhoto, readPhoto, savePhoto } from "@/lib/photo-storage";
import {
  designFromWedding,
  designSchema,
  mergeDesign,
  type WeddingDesign,
} from "@/lib/wedding-design";
import { storyUnlocked } from "@/lib/wedding-access";
import type { Wedding } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const used = (design: WeddingDesign, asset: string) =>
  Object.values(design.media).some((p) => p?.asset === asset);
async function handle(request: NextRequest, context: Context) {
  try {
    const [action, assetId] = (await context.params).path ?? [];
    const weddingId = request.nextUrl.searchParams.get("wedding");
    if (!weddingId) throw new HttpError(400, "Choose a wedding.");
    const method = request.method;
    if (method !== "GET") sameOrigin(request);
    if (action === "assets" && assetId && method === "GET") {
      const asset = (
        await rows(
          "SELECT * FROM design_assets WHERE id=$1 AND wedding_id=$2",
          [assetId, weddingId],
        )
      )[0];
      if (!asset) throw new HttpError(404, "Photo unavailable.");
      let editor = false;
      try {
        await access(weddingId);
        editor = true;
      } catch (error) {
        if (!(error instanceof HttpError)) throw error;
      }
      if (!editor) {
        const wedding = (
          await rows("SELECT * FROM weddings WHERE id=$1", [weddingId])
        )[0];
        if (
          !wedding ||
          !used(designFromWedding(wedding as unknown as Wedding), assetId)
        )
          throw new HttpError(404, "Photo unavailable.");
        const token = request.nextUrl.searchParams.get("token");
        const invitation =
          token &&
          (
            await rows(
              "SELECT id FROM invitation_tokens WHERE wedding_id=$1 AND token_hash=$2 AND revoked=false AND expires_at>now()",
              [weddingId, hash(token)],
            )
          )[0];
        const publicAccess =
          wedding.status !== "draft" &&
          (wedding.privacy === "public" ||
            (wedding.privacy === "password" &&
              (await storyUnlocked(weddingId, String(wedding.password_hash)))));
        if (!invitation && !publicAccess)
          throw new HttpError(404, "Photo unavailable.");
      }
      return new Response(await readPhoto(String(asset.filename)), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const { wedding, user } = await access(weddingId, method !== "GET");
    const initial = designFromWedding(wedding as unknown as Wedding);
    await (
      await db()
    ).query(
      "INSERT INTO wedding_designs(wedding_id,draft,published) VALUES($1,$2,$2) ON CONFLICT DO NOTHING",
      [weddingId, JSON.stringify(initial)],
    );
    if (!action && method === "GET") {
      const state = (
        await rows(
          "SELECT revision,draft,published FROM wedding_designs WHERE wedding_id=$1",
          [weddingId],
        )
      )[0];
      const assets = await rows(
        "SELECT id,name,width,height,bytes FROM design_assets WHERE wedding_id=$1 ORDER BY created_at DESC",
        [weddingId],
      );
      return json({ ...state, assets });
    }
    if (action === "assets" && method === "POST") {
      if (user.is_demo)
        throw new HttpError(
          403,
          "Create your wedding to add personal photos. You can explore every design with the sample artwork.",
        );
      await rateLimit(`design-upload:${weddingId}`, 60);
      // Stay below the hosted request limit; the client prepares large phone images.
      if (Number(request.headers.get("content-length") || 0) > 4_400_000)
        throw new HttpError(
          413,
          "Choose a photo under 4 MB or let the photo picker prepare it.",
        );
      const reader = request.body?.getReader();
      if (!reader) throw new HttpError(400, "Choose a photo.");
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        total += chunk.value.byteLength;
        if (total > 4_400_000) {
          await reader.cancel();
          throw new HttpError(413, "Choose a photo under 4 MB.");
        }
        chunks.push(chunk.value);
      }
      const form = await new Response(Buffer.concat(chunks), {
        headers: { "Content-Type": request.headers.get("content-type") || "" },
      }).formData();
      const file = form.get("file");
      if (!(file instanceof File) || !file.size || file.size > 4_000_000)
        throw new HttpError(400, "Choose a JPG, PNG or WebP photo under 4 MB.");
      const bytes = Buffer.from(await file.arrayBuffer());
      const digest = createHash("sha256").update(bytes).digest("hex");
      const existing = (
        await rows(
          "SELECT id,name,width,height,bytes FROM design_assets WHERE wedding_id=$1 AND digest=$2",
          [weddingId, digest],
        )
      )[0];
      if (existing) return json(existing);
      let original: Buffer, display: Buffer, width: number, height: number;
      try {
        const source = sharp(bytes, {
          limitInputPixels: 40_000_000,
          animated: false,
        });
        const metadata = await source.metadata();
        if (
          !["jpeg", "png", "webp"].includes(metadata.format || "") ||
          (metadata.pages ?? 1) > 1
        )
          throw new Error("format");
        const normalized = await source
          .rotate()
          .webp({ quality: 95 })
          .toBuffer({ resolveWithObject: true });
        original = normalized.data;
        width = normalized.info.width;
        height = normalized.info.height;
        display = await sharp(original)
          .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new HttpError(
          400,
          "This photo could not be opened. Choose a JPG, PNG or WebP. For HEIC, export a JPEG first.",
        );
      }
      const photoId = id();
      const stored: string[] = [];
      try {
        stored.push(await savePhoto(weddingId, photoId, display));
        stored.push(await savePhoto(weddingId, photoId + "-source", original));
        const result = await transaction(async (connection) => {
          // Serialize quota checks and deduplication with deletion/publication.
          await connection.query(
            "SELECT wedding_id FROM wedding_designs WHERE wedding_id=$1 FOR UPDATE",
            [weddingId],
          );
          const prior = (
            await connection.query(
              "SELECT id,name,width,height,bytes FROM design_assets WHERE wedding_id=$1 AND digest=$2",
              [weddingId, digest],
            )
          ).rows[0];
          if (prior) return { prior };
          const quota = (
            await connection.query(
              "SELECT count(*)::int count,COALESCE(sum(bytes),0)::bigint bytes FROM design_assets WHERE wedding_id=$1",
              [weddingId],
            )
          ).rows[0];
          if (
            Number(quota.count) >= 50 ||
            Number(quota.bytes) + original.length + display.length > 250_000_000
          )
            throw new HttpError(
              400,
              "Your photo library is full (50 photos or 250 MB). Remove unused photos to make room.",
            );
          const asset = {
            id: photoId,
            name: file.name.slice(0, 160),
            width,
            height,
            bytes: original.length + display.length,
          };
          await connection.query(
            "INSERT INTO design_assets(id,wedding_id,filename,original_filename,name,digest,width,height,bytes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            [
              photoId,
              weddingId,
              stored[0],
              stored[1],
              asset.name,
              digest,
              width,
              height,
              asset.bytes,
            ],
          );
          return { asset };
        });
        if (result.prior) {
          await Promise.all(stored.map(deletePhoto));
          return json(result.prior);
        }
        return json(result.asset);
      } catch (error) {
        await Promise.allSettled(stored.map(deletePhoto));
        throw error;
      }
    }
    if (action === "assets" && assetId && method === "DELETE") {
      const removed = await transaction(async (connection) => {
        const state = (
          await connection.query(
            "SELECT * FROM wedding_designs WHERE wedding_id=$1 FOR UPDATE",
            [weddingId],
          )
        ).rows[0];
        const live = (
          await connection.query("SELECT * FROM weddings WHERE id=$1", [
            weddingId,
          ])
        ).rows[0];
        if (
          [
            state.draft,
            state.published,
            designFromWedding(live as unknown as Wedding),
          ].some((d) => used(d as WeddingDesign, assetId))
        )
          throw new HttpError(
            409,
            "This photo is used by a saved draft or live invitation. Replace it there and publish before deleting.",
          );
        return (
          await connection.query(
            "DELETE FROM design_assets WHERE id=$1 AND wedding_id=$2 RETURNING filename,original_filename",
            [assetId, weddingId],
          )
        ).rows[0];
      });
      if (removed)
        await Promise.all([
          deletePhoto(String(removed.filename)),
          deletePhoto(String(removed.original_filename)),
        ]);
      return json({ ok: true });
    }
    if (
      (!action && method === "PATCH") ||
      (action === "publish" && method === "POST")
    ) {
      const input = z
        .object({
          revision: z.number().int().min(0),
          base: designSchema,
          draft: designSchema,
        })
        .parse(await readJson(request, 200_000));
      const result = await transaction(async (connection) => {
        const state = (
          await connection.query(
            "SELECT * FROM wedding_designs WHERE wedding_id=$1 FOR UPDATE",
            [weddingId],
          )
        ).rows[0];
        let next = input.draft;
        if (state.revision !== input.revision) {
          if (action === "publish") return { conflict: true, state };
          const merge = mergeDesign(
            input.base,
            input.draft,
            state.draft as WeddingDesign,
          );
          if (merge.conflicts.length)
            return { conflict: true, state, fields: merge.conflicts };
          next = merge.merged;
        }
        for (const placement of Object.values(next.media)) {
          if (
            placement &&
            !(
              await connection.query(
                "SELECT id FROM design_assets WHERE id=$1 AND wedding_id=$2",
                [placement.asset, weddingId],
              )
            ).rows.length
          )
            throw new HttpError(
              400,
              "A selected photo is unavailable. Choose another photo before saving.",
            );
        }
        const revision = Number(state.revision) + 1;
        await connection.query(
          "UPDATE wedding_designs SET draft=$2,revision=$3,updated_at=now() WHERE wedding_id=$1",
          [weddingId, JSON.stringify(next), revision],
        );
        if (action === "publish") {
          await connection.query(
            "UPDATE wedding_designs SET published=$2 WHERE wedding_id=$1",
            [weddingId, JSON.stringify(next)],
          );
          await connection.query(
            "UPDATE weddings SET world=$2,opening=$3,story=$4,settings=COALESCE(settings,'{}'::jsonb) || $5::jsonb WHERE id=$1",
            [
              weddingId,
              next.world,
              next.opening,
              next.story,
              JSON.stringify({ identity: next.identity, media: next.media }),
            ],
          );
        }
        return {
          revision,
          draft: next,
          published: action === "publish" ? next : state.published,
        };
      });
      return json(result, "conflict" in result ? 409 : 200);
    }
    throw new HttpError(405, "This action is unavailable.");
  } catch (error) {
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return json({ error: "Check your design choices and try again." }, 400);
    console.error("Design request failed", error);
    return json(
      { error: "We could not save that change. Please try again." },
      500,
    );
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
