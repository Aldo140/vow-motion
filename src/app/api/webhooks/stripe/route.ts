import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { transaction } from "@/lib/db";
import { id } from "@/lib/auth";
import { readBytes } from "@/lib/request-body";
import { HttpError } from "@/lib/security/http-error";

/** Generous for any realistic event payload, bounded against abuse. Read
 * before parsing or verifying, so nothing downstream ever sees more. */
const MAX_WEBHOOK_BYTES = 2_000_000;

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  // Bounded so an oversized body cannot be buffered before rejection — the
  // byte cap is not part of what gets signed. A clean 4xx (rather than an
  // unhandled 500) tells Stripe's retry logic not to bother redelivering.
  let raw: string;
  try {
    raw = (await readBytes(req, MAX_WEBHOOK_BYTES)).toString("utf8");
  } catch (error) {
    if (error instanceof HttpError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const header = req.headers.get("stripe-signature") || "",
    parts = header.split(","),
    timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const expected = createHmac("sha256", secret)
    .update(timestamp + "." + raw)
    .digest();
  const valid = parts
    .filter((p) => p.startsWith("v1="))
    .some((p) => {
      const actual = Buffer.from(p.slice(3), "hex");
      return (
        actual.length === expected.length && timingSafeEqual(actual, expected)
      );
    });
  if (!valid)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const event = JSON.parse(raw);
  await transaction(async (c) => {
    const inserted = await c.query(
      "INSERT INTO webhook_events(id,provider) VALUES($1,$2) ON CONFLICT(id) DO NOTHING RETURNING id",
      [event.id, "stripe"],
    );
    if (!inserted.rows.length) return;
    if (
      event.type === "checkout.session.completed" &&
      event.data.object.payment_status === "paid"
    ) {
      const session = event.data.object;
      const weddingId = session.metadata?.wedding_id,
        plan = session.metadata?.plan;
      if (!weddingId || !["essential", "signature", "bespoke"].includes(plan))
        return;
      await c.query(
        "INSERT INTO subscriptions(id,wedding_id,plan,status,provider_id) VALUES($1,$2,$3,'paid',$4) ON CONFLICT(wedding_id) DO UPDATE SET plan=$3,status='paid',provider_id=$4",
        [id(), weddingId, plan, session.id],
      );
    }
  });
  return NextResponse.json({ received: true });
}
