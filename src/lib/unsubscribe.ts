import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A guest could give consent at RSVP and then had no way to withdraw it except
 * by asking a human. That is a compliance gap on mail sent on a paying
 * customer's behalf, which makes it their problem as well as ours.
 *
 * The token is a stateless HMAC over the guest id: no table, no expiry to
 * manage, and no way for a link in a year-old email to stop working. CASL
 * requires the mechanism to stay valid at least 60 days after sending, and
 * RFC 8058 expects the POST to work with no further interaction — a token with
 * no expiry satisfies both without any bookkeeping.
 */

/**
 * Falls back to CRON_SECRET so a deployment that has not yet set
 * UNSUBSCRIBE_SECRET still mints verifiable tokens rather than silently
 * signing everything with an empty key. Returns null when neither exists, and
 * every caller treats that as "do not offer unsubscribe at all" rather than
 * shipping a link that cannot be honoured.
 */
function secret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null;
}

export function unsubscribeToken(guestId: string) {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(guestId).digest("base64url");
}

export function verifyUnsubscribeToken(guestId: string, token: string) {
  const expected = unsubscribeToken(guestId);
  if (!expected || !token) return false;
  const a = Buffer.from(expected),
    b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The absolute URL that goes in the email. Null when unsubscribe is unavailable. */
export function unsubscribeUrl(guestId: string) {
  const token = unsubscribeToken(guestId);
  const origin = process.env.APP_URL;
  if (!token || !origin) return null;
  return `${origin.replace(/\/+$/, "")}/api/u/${encodeURIComponent(guestId)}/${token}`;
}

/**
 * The RFC 8058 pair. Both headers or neither — a `List-Unsubscribe` without its
 * `-Post` companion does not give one-click, and the angle brackets around the
 * URL are part of the header value (RFC 2369), not JSON quoting.
 *
 * Scope is deliberate. These belong on wedding updates and announcements. They
 * do **not** belong on the invitation itself, on RSVP confirmations, or on
 * account verification mail: those are transactional, the guest asked for them,
 * and an unsubscribe link on a wedding invitation is a bad experience as well
 * as being unnecessary.
 */
export function unsubscribeHeaders(guestId: string) {
  const url = unsubscribeUrl(guestId);
  if (!url) return undefined;
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
