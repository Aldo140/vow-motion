import { db, rows, transaction } from "./db";
import { id, HttpError, audit } from "./auth";
import { deliver } from "./providers";
export async function sendMessage(
  weddingId: string,
  messageId: string,
  actorId: string,
  demo: boolean,
) {
  const message = (
    await rows("SELECT * FROM messages WHERE id=$1 AND wedding_id=$2", [
      messageId,
      weddingId,
    ])
  )[0];
  if (!message) throw new HttpError(404, "Message not found.");
  if (
    message.channel !== "invitation" &&
    message.scheduled_at &&
    new Date(String(message.scheduled_at)) > new Date()
  )
    throw new HttpError(400, "This message is scheduled for later.");
  let guests = await rows("SELECT * FROM guests WHERE wedding_id=$1", [
    weddingId,
  ]);
  if (message.audience !== "everyone")
    guests = guests.filter(
      (g) =>
        g.status === message.audience ||
        String(g.tags)
          .split(",")
          .map((t) => t.trim())
          .includes(String(message.audience)),
    );
  guests = guests.filter(
    (g) =>
      message.channel === "invitation" ||
      (g.consent && (message.channel === "email" ? g.email : g.phone)),
  );
  if (!guests.length)
    throw new HttpError(
      400,
      "No guests in this audience have contact details and messaging consent.",
    );
  if (message.channel === "invitation") {
    return transaction(async (connection) => {
      const claimed = await connection.query(
        "UPDATE messages SET status='published' WHERE id=$1 AND status='draft' RETURNING id",
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
      };
    });
  }
  const claimed = await (
    await db()
  ).query(
    "UPDATE messages SET status='processing' WHERE id=$1 AND status='draft' RETURNING id",
    [messageId],
  );
  if (!claimed.rows.length)
    throw new HttpError(
      409,
      "This message is already being processed or has been sent.",
    );
  let accepted = 0,
    development = false;
  for (const g of guests) {
    const deliveryId = id();
    await (
      await db()
    ).query(
      "INSERT INTO deliveries(id,wedding_id,message_id,guest_id) VALUES($1,$2,$3,$4) ON CONFLICT(message_id,guest_id) DO NOTHING",
      [deliveryId, weddingId, messageId, g.id],
    );
    try {
      const result = await deliver({
        channel: String(message.channel),
        to: String(message.channel === "email" ? g.email : g.phone),
        subject: String(message.subject),
        body: String(message.body),
        idempotencyKey: deliveryId,
        demo,
      });
      development = result.status === "development";
      await (
        await db()
      ).query("UPDATE deliveries SET status=$1,provider_id=$2 WHERE id=$3", [
        result.status,
        result.provider_id,
        deliveryId,
      ]);
      accepted++;
    } catch {
      await (
        await db()
      ).query(
        "UPDATE deliveries SET status='failed',error='Provider rejected request' WHERE id=$1",
        [deliveryId],
      );
    }
  }
  await (
    await db()
  ).query("UPDATE messages SET status=$1 WHERE id=$2", [
    development
      ? "development"
      : accepted === guests.length
        ? "sent"
        : "partially-failed",
    messageId,
  ]);
  await audit(
    weddingId,
    actorId,
    development
      ? "Message recorded in development outbox"
      : `${accepted} messages accepted by provider`,
  );
  return { ok: true, development, count: accepted };
}
