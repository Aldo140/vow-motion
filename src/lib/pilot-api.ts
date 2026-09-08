import { z } from "zod";
import { db } from "./db";
import { HttpError, id, audit } from "./auth";
import { identitySchema } from "./identity";
import { studioData } from "./data";
import { setupSteps } from "./pilot";

export async function pilotAction(
  action: string,
  item: string | undefined,
  method: string,
  weddingId: string,
  userId: string,
  role: string,
  input: unknown,
) {
  const connection = await db();
  if (action === "identity" && method === "PATCH") {
    if ((await connection.query("SELECT wedding_id FROM wedding_designs WHERE wedding_id=$1", [weddingId])).rows.length)
      throw new HttpError(409, "Use Your experience to save identity choices in your design draft.");
    const identity = identitySchema.parse(input);
    await connection.query(
      "UPDATE weddings SET settings=COALESCE(settings,'{}'::jsonb) || jsonb_build_object('identity',$2::jsonb) WHERE id=$1",
      [weddingId, JSON.stringify(identity)],
    );
    await audit(weddingId, userId, "Wedding identity refined");
    return { ok: true };
  }
  if (action === "setup" && method === "PATCH") {
    const { step, done } = z
      .object({
        step: z.enum(["identity", "details", "events", "guests", "preview"]),
        done: z.boolean(),
      })
      .parse(input);
    await connection.query(
      "UPDATE weddings SET settings=jsonb_set(COALESCE(settings,'{}'::jsonb),'{setup}',COALESCE(settings->'setup','{}'::jsonb) || jsonb_build_object($2::text,$3::boolean)) WHERE id=$1",
      [weddingId, step, done],
    );
    return { ok: true };
  }
  if (action === "publish" && method === "POST") {
    if (!["owner", "partner"].includes(role))
      throw new HttpError(403, "Only the couple can publish the wedding.");
    const data = await studioData(weddingId);
    if (setupSteps(data).some((step) => !step.done))
      throw new HttpError(400, "Complete the setup review before publishing.");
    await connection.query(
      "UPDATE weddings SET status='published' WHERE id=$1",
      [weddingId],
    );
    await audit(weddingId, userId, "Wedding published after setup review");
    return { ok: true };
  }
  if (action === "feedback" && method === "POST") {
    const entry = z
      .object({
        screen: z
          .string()
          .regex(/^\/studio(?:\/[a-z-]+)?$/)
          .max(120),
        body: z.string().trim().min(5).max(4000),
      })
      .parse(input);
    await connection.query(
      "INSERT INTO pilot_feedback(id,wedding_id,author_id,screen,body) VALUES($1,$2,$3,$4,$5)",
      [id(), weddingId, userId, entry.screen, entry.body],
    );
    return { ok: true };
  }
  if (action === "feedback" && method === "PATCH") {
    const { status } = z
      .object({ status: z.enum(["open", "in-progress", "resolved"]) })
      .parse(input);
    const result = await connection.query(
      "UPDATE pilot_feedback SET status=$1 WHERE id=$2 AND wedding_id=$3 RETURNING id",
      [status, item, weddingId],
    );
    if (!result.rows.length) throw new HttpError(404, "Feedback not found.");
    return { ok: true };
  }
  if (action === "requests" && method === "PATCH") {
    const { answer } = z
      .object({ answer: z.string().trim().min(1).max(4000) })
      .parse(input);
    const result = await connection.query(
      "UPDATE guest_requests SET answer=$1 WHERE id=$2 AND wedding_id=$3 RETURNING id",
      [answer, item, weddingId],
    );
    if (!result.rows.length)
      throw new HttpError(404, "Guest question not found.");
    await audit(
      weddingId,
      userId,
      "Guest question answered in their invitation",
    );
    return { ok: true };
  }
  throw new HttpError(405, "This action is unavailable.");
}
