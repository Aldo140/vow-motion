import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { transaction } from "@/lib/db";
import type { Database } from "@/lib/db";

/**
 * What Resend tells us after it has said 200. Until this endpoint existed,
 * `sent` meant "the provider accepted the request" and nothing ever revised it,
 * so a guest whose invitation hard-bounced was indistinguishable from a guest
 * who read it. Everything here is a correction to a row we already wrote.
 */

/** Svix retries a failing endpoint for ~27 hours and disables it after five days. */
const TOLERANCE_SECONDS = 300;

/**
 * How each event rewrites `deliveries.status`. `null` means the event is
 * informational and the status is left alone — `delivery_delayed` in
 * particular, where Resend is still retrying internally and re-sending on our
 * side would double-deliver.
 */
const STATUS_BY_EVENT: Record<string, string | null> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": null,
  "email.failed": "failed",
  "email.suppressed": "suppressed",
};

/** A delivery in one of these has finished; a later, older event must not undo it. */
const TERMINAL = ["delivered", "bounced", "complained", "suppressed"];

/** Verify the Svix signature over the exact bytes we were sent. */
function verify(secret: string, raw: string, headers: Headers) {
  const svixId = headers.get("svix-id"),
    timestamp = headers.get("svix-timestamp"),
    signature = headers.get("svix-signature");
  if (!svixId || !timestamp || !signature) return null;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS)
    return null;
  // The secret is base64 after the `whsec_` prefix; the HMAC is over the raw key.
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${svixId}.${timestamp}.${raw}`)
    .digest();
  // Space-separated, each `v1,<base64>`. Any one match is valid.
  const valid = signature.split(" ").some((part) => {
    if (!part.startsWith("v1,")) return false;
    const actual = Buffer.from(part.slice(3), "base64");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  });
  return valid ? svixId : null;
}

/**
 * A hard bounce or a complaint withdraws consent. `unsubscribed_at` is set
 * alongside it because `consent` alone is rewritten wholesale by the guest
 * import and by the couple's own edits — the fact of the withdrawal has to
 * survive a re-imported spreadsheet.
 */
async function withdrawConsent(
  connection: Database,
  deliveryId: string,
  reason: string,
) {
  await connection.query(
    `UPDATE guests SET consent=false, unsubscribed_at=COALESCE(unsubscribed_at,now()), suppressed_reason=$2
       WHERE id=(SELECT guest_id FROM deliveries WHERE id=$1)`,
    [deliveryId, reason],
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });

  // Read the body before parsing: the signature is over these exact bytes.
  const raw = await req.text();
  const svixId = verify(secret, raw, req.headers);
  if (!svixId)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const type = String(event.type || ""),
    data = event.data || {};

  await transaction(async (c) => {
    // Same replay guard Stripe uses, and it matters more here: Svix retries
    // eight times over roughly 27 hours, so a slow response is redelivered.
    const inserted = await c.query(
      "INSERT INTO webhook_events(id,provider) VALUES($1,$2) ON CONFLICT(id) DO NOTHING RETURNING id",
      [svixId, "resend"],
    );
    if (!inserted.rows.length) return;

    // Suppression is team-wide and silent: once Resend suppresses an address,
    // later sends to it are skipped without error. Mirroring it locally is the
    // only way the Studio can explain the silence.
    if (type === "suppression.added" || type === "suppression.removed") {
      const address = String(data.email || data.to || "").trim();
      if (!address) return;
      await c.query(
        type === "suppression.added"
          ? "UPDATE guests SET suppressed_reason='provider-suppression' WHERE lower(email)=lower($1)"
          : "UPDATE guests SET suppressed_reason=NULL WHERE lower(email)=lower($1) AND suppressed_reason='provider-suppression'",
        [address],
      );
      return;
    }

    if (!(type in STATUS_BY_EVENT)) return;
    const status = STATUS_BY_EVENT[type];

    // Every email event payload carries `email_id`, which is what we stored as
    // `provider_id`, so one lookup covers all of them.
    const emailId = String(data.email_id || "");
    if (!emailId) return;
    const delivery = (
      await c.query<{ id: string; status: string }>(
        "SELECT id,status FROM deliveries WHERE provider_id=$1",
        [emailId],
      )
    ).rows[0];
    if (!delivery) {
      const invitation = (
        await c.query<{ id: string; status: string }>(
          "SELECT id,status FROM invitation_dispatches WHERE provider_id=$1",
          [emailId],
        )
      ).rows[0];
      if (!invitation || status === null) return;
      if (TERMINAL.includes(invitation.status) && status === "sent") return;
      const reason = String(data.reason || "").slice(0, 500) || null;
      await c.query(
        "UPDATE invitation_dispatches SET status=$1,error=COALESCE($2,error),updated_at=now() WHERE id=$3",
        [status, reason, invitation.id],
      );
      return;
    }
    if (status === null) return;

    // Webhooks arrive out of order. A late `email.sent` must not overwrite a
    // `bounced` that already landed.
    if (TERMINAL.includes(delivery.status) && status === "sent") return;

    const bounce = (data.bounce || {}) as Record<string, unknown>;
    const bounceType = bounce.type
      ? [bounce.type, bounce.subType].filter(Boolean).join("/")
      : null;
    const reason =
      String(data.reason || bounce.message || "").slice(0, 500) || null;

    await c.query(
      `UPDATE deliveries
          SET status=$1,
              bounce_type=COALESCE($2,bounce_type),
              error=COALESCE($3,error),
              next_attempt_at=NULL,
              updated_at=now()
        WHERE id=$4`,
      [status, bounceType, reason, delivery.id],
    );

    // A complaint is permanent and immediate. A bounce withdraws consent only
    // when it is Permanent — a transient bounce is a full mailbox, not a
    // person asking to be left alone.
    if (status === "complained")
      await withdrawConsent(c, delivery.id, "complained");
    else if (status === "bounced" && bounce.type === "Permanent")
      await withdrawConsent(c, delivery.id, "hard-bounce");
  });

  return NextResponse.json({ received: true });
}
