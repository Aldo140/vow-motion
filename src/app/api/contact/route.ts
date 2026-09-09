import { z } from "zod";
import { sameOrigin, rateLimit, hash, HttpError } from "@/lib/auth";
import { readJson } from "@/lib/request-body";
import { db, transaction } from "@/lib/db";
import { contactEmail, contactSchema, contactMessage } from "@/lib/contact";
import { deliver, emailAvailable } from "@/lib/providers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const json = (body: unknown, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  try {
    sameOrigin(request);
    const input = contactSchema.parse(await readJson(request, 16_000));
    await rateLimit(
      "contact:" +
        hash(
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown",
        ),
      5,
    );
    if (!emailAvailable())
      throw new HttpError(
        503,
        "The form is temporarily unavailable. Please use the email link below; your message is still here.",
      );
    const message = contactMessage(input),
      digest = hash(message);
    const claim = await transaction(async (connection) => {
      const inserted = await connection.query(
        "INSERT INTO contact_enquiries(id,digest,role,name,email,message) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id",
        [input.requestId, digest, input.role, input.name, input.email, message],
      );
      if (inserted.rows.length) return true;
      const previous = (
        await connection.query(
          "SELECT * FROM contact_enquiries WHERE id=$1 FOR UPDATE",
          [input.requestId],
        )
      ).rows[0];
      if (previous.digest !== digest)
        throw new HttpError(
          409,
          "Your message changed. Please try sending it again.",
        );
      if (previous.status === "sent") return false;
      const retried = await connection.query(
        "UPDATE contact_enquiries SET status='sending',updated_at=now() WHERE id=$1 AND (status='failed' OR updated_at<now()-interval '90 seconds') RETURNING id",
        [input.requestId],
      );
      if (!retried.rows.length)
        throw new HttpError(
          409,
          "Your message is still being sent. Please wait a moment before retrying.",
        );
      return true;
    });
    if (!claim) return json({ ok: true });
    try {
      const delivery = await deliver({
        channel: "email",
        to: contactEmail,
        subject: `Vow Motion · ${input.role === "planner" ? "Planner" : "Couple"} enquiry`,
        body: message,
        idempotencyKey: `contact-${input.requestId}`,
        demo: false,
      });
      if (delivery.status !== "sent")
        throw new HttpError(
          503,
          "Your message could not be delivered. Please use the email link below.",
        );
      await (
        await db()
      ).query(
        "UPDATE contact_enquiries SET status='sent',updated_at=now() WHERE id=$1",
        [input.requestId],
      );
      return json({ ok: true });
    } catch (error) {
      await (
        await db()
      ).query(
        "UPDATE contact_enquiries SET status='failed',updated_at=now() WHERE id=$1",
        [input.requestId],
      );
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        { error: error.issues[0]?.message || "Check the form and try again." },
        400,
      );
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    return json(
      {
        error:
          "We could not send your message. Please try again or email us directly below.",
      },
      500,
    );
  }
}
