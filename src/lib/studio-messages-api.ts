import { z } from "zod";
import { audit, HttpError, id } from "./auth";
import { db } from "./db";
import { sendMessage } from "./messages";

type MessageActionInput = {
  action?: string;
  item?: string;
  method: string;
  weddingId: string;
  userId: string;
  demo: boolean;
  readBody: () => Promise<unknown>;
};

export type MessageActionResult =
  | { handled: false }
  | { handled: true; value: unknown };

/**
 * Owns the Studio message command lifecycle. Keeping this outside the catch-all
 * route makes message changes reviewable without touching guest RSVP, photos,
 * billing, or wedding settings in the same control path.
 */
export async function studioMessagesAction({
  action,
  item,
  method,
  weddingId,
  userId,
  demo,
  readBody,
}: MessageActionInput): Promise<MessageActionResult> {
  if (action === "messages" && method === "POST") {
    const input = z
      .object({
        subject: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
        audience: z.string().max(200),
        channel: z.enum(["email", "sms", "invitation"]),
        scheduled_at: z
          .union([z.iso.datetime({ offset: true }), z.literal("")])
          .optional(),
      })
      .parse(await readBody());
    const messageId = id();
    await (
      await db()
    ).query(
      "INSERT INTO messages(id,wedding_id,subject,body,audience,channel,scheduled_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        messageId,
        weddingId,
        input.subject,
        input.body,
        input.audience,
        input.channel,
        input.scheduled_at || null,
      ],
    );
    await audit(weddingId, userId, "Message draft saved");
    return { handled: true, value: { id: messageId } };
  }

  if (action === "messages" && method === "DELETE") {
    const removed = await (
      await db()
    ).query(
      "DELETE FROM messages WHERE id=$1 AND wedding_id=$2 AND status IN ('draft','failed') RETURNING id",
      [item, weddingId],
    );
    if (!removed.rows.length) {
      throw new HttpError(
        409,
        "Only a draft that has not reached anyone can be discarded.",
      );
    }
    await audit(weddingId, userId, "Message draft discarded");
    return { handled: true, value: { ok: true } };
  }

  if (action === "send" && method === "POST") {
    const sendNow = await readBody()
      .then((parsed) => (parsed as { now?: unknown })?.now === true)
      .catch(() => false);
    return {
      handled: true,
      value: await sendMessage(weddingId, item || "", userId, demo, sendNow),
    };
  }

  return { handled: false };
}
