import { db, rows, transaction } from "./db";
import { id, HttpError, audit } from "./auth";
import { deliver, isRetryable } from "./providers";
import { messagingAudience } from "./messaging-audience";
import { unsubscribeHeaders } from "./unsubscribe";
import { issueInvitationToken } from "./seed";
import { invitationEmailHtml } from "./email-html";

/** A send that stopped this long ago is finished, whatever its row still says. */
const STALLED_AFTER = "10 minutes";

/** Statuses a send may be started from: never sent, or previously unsuccessful. */
const RESENDABLE = "'draft','failed','partially-failed'";

/**
 * Backoff for a transient refusal — a 429, a 5xx, a timeout. Three attempts
 * over two and a half hours, which is inside the 24 hours Resend honours an
 * idempotency key for, so a retry cannot double-send. Past that window the
 * protection is gone, which is the reason for the cap rather than a longer tail.
 */
const RETRY_SCHEDULE = ["5 minutes", "30 minutes", "2 hours"];
export const MAX_ATTEMPTS = RETRY_SCHEDULE.length;

export async function sendMessage(
  weddingId: string,
  messageId: string,
  actorId: string,
  demo: boolean,
  sendNow = false,
) {
  const message = (
    await rows("SELECT * FROM messages WHERE id=$1 AND wedding_id=$2", [
      messageId,
      weddingId,
    ])
  )[0];
  if (!message) throw new HttpError(404, "Message not found.");
  const scheduled =
    message.scheduled_at && new Date(String(message.scheduled_at)) > new Date();
  // An invitation update is published now and simply appears at its scheduled
  // time. Email and SMS leave immediately, so a scheduled one waits for the
  // delivery run unless somebody deliberately asks to send it early.
  if (message.channel !== "invitation" && scheduled && !sendNow)
    throw new HttpError(
      400,
      "This message is scheduled for later. Send it now instead if you would rather not wait.",
    );
  const allGuests = await rows(
    `SELECT g.*,h.name household_name FROM guests g
     JOIN households h ON h.id=g.household_id WHERE g.wedding_id=$1`,
    [weddingId],
  );
  const wedding = (
    await rows<{ names: string; location: string; owner_email: string }>(
      `SELECT w.names,w.location,u.email owner_email FROM weddings w
       JOIN users u ON u.id=w.owner_id WHERE w.id=$1`,
      [weddingId],
    )
  )[0];
  const {
    recipients: guests,
    awaitingOptIn,
    awaitingContact,
    awaitingBoth,
  } = messagingAudience(
    allGuests,
    String(message.audience),
    String(message.channel),
  );
  if (!guests.length)
    throw new HttpError(
      400,
      message.channel === "invitation"
        ? "No guests match this audience, so there is nobody to publish this to. Choose another audience."
        : `Nobody in this audience can be reached by ${message.channel === "sms" ? "text" : "email"} yet: ` +
            [
              awaitingOptIn &&
                `${awaitingOptIn} have not chosen wedding updates`,
              awaitingContact &&
                `${awaitingContact} have no ${message.channel === "sms" ? "mobile number" : "email address"} on file`,
              awaitingBoth && `${awaitingBoth} have neither`,
            ]
              .filter(Boolean)
              .join(", ") +
            ". You can post this note inside their invitations instead, where nothing is required of them.",
    );

  if (message.channel === "invitation") {
    return transaction(async (connection) => {
      const claimed = await connection.query(
        "UPDATE messages SET status='published',updated_at=now() WHERE id=$1 AND status='draft' RETURNING id",
        [messageId],
      );
      if (!claimed.rows.length)
        throw new HttpError(409, "This update is already published.");
      for (const guest of guests)
        await connection.query(
          "INSERT INTO deliveries(id,wedding_id,message_id,guest_id,status) VALUES($1,$2,$3,$4,'published') ON CONFLICT(message_id,guest_id) DO NOTHING",
          [id(), weddingId, messageId, guest.id],
        );
      return {
        ok: true,
        development: false,
        published: true,
        count: guests.length,
        failed: 0,
        skipped: 0,
      };
    });
  }

  // Claim the message before touching a provider, so two tabs — or the Studio
  // and the nightly delivery run — cannot send the same note twice. A send that
  // stalled long enough ago to be over is claimable again, which is what makes
  // "Try again" possible at all.
  const claimed = await (
    await db()
  ).query(
    `UPDATE messages SET status='processing',updated_at=now()
       WHERE id=$1 AND (status IN (${RESENDABLE})
         OR (status='processing' AND updated_at < now() - interval '${STALLED_AFTER}'))
       RETURNING id`,
    [messageId],
  );
  if (!claimed.rows.length)
    throw new HttpError(
      409,
      "This message is already being sent, or has been sent. Reload to see where it got to.",
    );

  // A retry must not reach anyone who already received it. Every guest with a
  // delivery that left the building is skipped, and only the failures go again.
  const alreadyReached = new Set(
    (
      await rows(
        "SELECT guest_id FROM deliveries WHERE message_id=$1 AND status IN ('sent','development')",
        [messageId],
      )
    ).map((row) => String(row.guest_id)),
  );
  const alreadyReachedHouseholds = new Set(
    (
      await rows(
        `SELECT DISTINCT g.household_id FROM deliveries d
         JOIN guests g ON g.id=d.guest_id
         WHERE d.message_id=$1 AND d.status IN ('sent','development')`,
        [messageId],
      )
    ).map((row) => String(row.household_id)),
  );
  const needsPrivateLink = String(message.body).includes("{{invitation_link}}") || String(message.subject).includes("{{invitation_link}}");
  const householdSeen = new Set<string>();
  const outstanding = guests.filter((g) => {
    if (alreadyReached.has(String(g.id))) return false;
    if (!needsPrivateLink) return true;
    const householdId = String(g.household_id);
    if (alreadyReachedHouseholds.has(householdId)) return false;
    if (householdSeen.has(householdId)) return false;
    householdSeen.add(householdId);
    return true;
  });

  let accepted = 0,
    failed = 0,
    development = false,
    lastError = "";
  for (const g of outstanding) {
    const invitation = needsPrivateLink
      ? await issueInvitationToken(weddingId, String(g.household_id), false)
      : null;
    const invitationLink = invitation
      ? `${process.env.APP_URL || "http://localhost:3000"}/i/${invitation.raw}`
      : "";
    const personalize = (value: unknown) => String(value)
      .replaceAll("{{household}}", String(g.household_name || g.name))
      .replaceAll("{{guest}}", String(g.name))
      .replaceAll("{{couple}}", String(wedding.names))
      .replaceAll("{{invitation_link}}", invitationLink);
    const personalSubject = personalize(message.subject);
    const personalBody = personalize(message.body);
    // Reuse the existing row's id, never a fresh one. That id is the
    // Idempotency-Key handed to the provider, so regenerating it on a resume
    // made Resend treat the retry as a distinct message and send the guest a
    // second copy. Its `attempts` count is also the retry budget, which must
    // survive the resume for the backoff to terminate.
    const existing = (
      await rows<{ id: string; attempts: number | null }>(
        "SELECT id,attempts FROM deliveries WHERE message_id=$1 AND guest_id=$2",
        [messageId, g.id],
      )
    )[0];
    const deliveryId = existing ? String(existing.id) : id();
    if (existing)
      await (
        await db()
      ).query(
        "UPDATE deliveries SET status='queued',error=NULL,next_attempt_at=NULL,updated_at=now() WHERE id=$1",
        [deliveryId],
      );
    else
      await (
        await db()
      ).query(
        "INSERT INTO deliveries(id,wedding_id,message_id,guest_id) VALUES($1,$2,$3,$4)",
        [deliveryId, weddingId, messageId, g.id],
      );
    try {
      const result = await deliver({
        channel: String(message.channel),
        to: String(message.channel === "email" ? g.email : g.phone),
        subject: personalSubject,
        body: personalBody,
        html:
          message.channel === "email" && invitation
            ? invitationEmailHtml({
                body: personalBody,
                invitationLink,
                couple: String(wedding.names),
                location: String(wedding.location || ""),
              })
            : undefined,
        replyTo: message.channel === "email" ? String(wedding.owner_email) : undefined,
        idempotencyKey: deliveryId,
        demo,
        // Wedding updates and announcements carry the one-click unsubscribe
        // pair. Invitations do not: an update is something a guest opted in to
        // and can leave, whereas the invitation is the thing they were asked
        // to, and an unsubscribe link on it is both unnecessary and unkind.
        // Nothing is passed for SMS, where the headers are meaningless.
        headers:
          message.channel === "email"
            ? unsubscribeHeaders(String(g.id))
            : undefined,
      });
      development = result.status === "development";
      await (
        await db()
      ).query(
        "UPDATE deliveries SET status=$1,provider_id=$2,error=NULL,next_attempt_at=NULL,updated_at=now() WHERE id=$3",
        [result.status, result.provider_id, deliveryId],
      );
      accepted++;
    } catch (cause) {
      if (invitation)
        await (
          await db()
        ).query("UPDATE invitation_tokens SET revoked=true WHERE id=$1", [invitation.id]);
      // Keep the provider's own words. "Provider rejected request" told a
      // couple nothing about what to change.
      lastError = (cause as Error)?.message || "The provider refused it.";
      failed++;
      // A rate limit or a 5xx is worth another attempt on the worker's next
      // pass; a rejected address never will be, and retrying it only costs
      // sender reputation. Attempts are counted per delivery row, not per send,
      // so a couple pressing "Try again" does not reset the budget.
      const retry = isRetryable(cause);
      const attempt = Number(existing?.attempts || 0) + 1;
      const backoff =
        retry && attempt <= MAX_ATTEMPTS ? RETRY_SCHEDULE[attempt - 1] : null;
      await (
        await db()
      ).query(
        `UPDATE deliveries SET status='failed',error=$1,attempts=$2,
           next_attempt_at=${backoff ? `now() + interval '${backoff}'` : "NULL"},
           updated_at=now() WHERE id=$3`,
        [lastError.slice(0, 500), attempt, deliveryId],
      );
    }
  }

  const reached = accepted + alreadyReached.size;
  const status = development
    ? "development"
    : failed === 0
      ? "sent"
      : accepted || alreadyReached.size
        ? "partially-failed"
        : "failed";
  await (
    await db()
  ).query("UPDATE messages SET status=$1,updated_at=now() WHERE id=$2", [
    status,
    messageId,
  ]);
  await audit(
    weddingId,
    actorId,
    development
      ? "Message recorded in development outbox"
      : failed
        ? `${accepted} messages accepted by provider, ${failed} failed`
        : `${accepted} messages accepted by provider`,
  );
  return {
    ok: true,
    development,
    count: accepted,
    reached,
    failed,
    skipped: alreadyReached.size,
    error: lastError,
  };
}
