import { HttpError } from "./auth";
export async function deliver(input: {
  channel: string;
  to: string;
  subject: string;
  body: string;
  idempotencyKey: string;
  demo: boolean;
}) {
  if (
    input.demo ||
    (!process.env.RESEND_API_KEY && input.channel === "email") ||
    (!process.env.TWILIO_ACCOUNT_SID && input.channel === "sms")
  )
    return { status: "development", provider_id: null };
  if (input.channel === "email") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });
    if (!response.ok)
      throw new HttpError(
        502,
        "The email provider did not accept this message.",
      );
    return { status: "sent", provider_id: (await response.json()).id };
  }
  const body = new URLSearchParams({
    To: input.to,
    From: process.env.TWILIO_FROM || "",
    Body: input.body,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  if (!response.ok)
    throw new HttpError(502, "The SMS provider did not accept this message.");
  return { status: "sent", provider_id: (await response.json()).sid };
}
export async function checkout(plan: string, weddingId: string, email: string) {
  const price = process.env["STRIPE_PRICE_" + plan.toUpperCase()];
  if (!process.env.STRIPE_SECRET_KEY || !price)
    throw new HttpError(
      503,
      "Payments are not enabled in this environment. Your wedding stays saved; no payment was taken.",
    );
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: `${process.env.APP_URL}/studio/settings?checkout=complete`,
    cancel_url: `${process.env.APP_URL}/studio/settings`,
    "metadata[wedding_id]": weddingId,
    "metadata[plan]": plan,
    customer_email: email,
  });
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!r.ok)
    throw new HttpError(502, "Checkout is unavailable. Please try again.");
  return (await r.json()).url;
}
