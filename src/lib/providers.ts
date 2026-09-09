import { HttpError } from "./auth";

/**
 * A provider refusal carrying the upstream status, so the caller can tell a
 * rate limit from a bad address. `deliver()` used to flatten every non-ok
 * response to a 502, which meant a Resend 429 and an invalid recipient were
 * indistinguishable — and a retryable failure lost a guest's invitation
 * permanently with nothing in the UI to say why.
 */
export class DeliveryError extends HttpError {
  constructor(
    message: string,
    readonly upstreamStatus: number,
    readonly detail = "",
  ) {
    super(502, message);
    this.name = "DeliveryError";
  }

  /** 429 and 5xx are worth another attempt; any other 4xx is the sender's fault. */
  get retryable() {
    return this.upstreamStatus === 429 || this.upstreamStatus >= 500;
  }
}

/** A timeout or a dropped connection never reached the provider; try again. */
export function isRetryable(cause: unknown) {
  if (cause instanceof DeliveryError) return cause.retryable;
  const name = (cause as Error)?.name;
  return name === "TimeoutError" || name === "AbortError" || name === "TypeError";
}

/** The provider's own words, trimmed to something a couple can read. */
async function refusal(response: Response, fallback: string) {
  let detail = "";
  try {
    const text = (await response.text()).slice(0, 500);
    try {
      const parsed = JSON.parse(text);
      detail = String(parsed?.message || parsed?.error?.message || text);
    } catch {
      detail = text;
    }
  } catch {
    /* body already consumed or unreadable; the status alone is enough */
  }
  return new DeliveryError(
    detail ? `${fallback} (${response.status}: ${detail})` : fallback,
    response.status,
    detail,
  );
}
export const emailAvailable = () =>
  Boolean(
    process.env.RESEND_API_KEY ||
    (process.env.AGENTMAIL_API_KEY && process.env.AGENTMAIL_INBOX_ID),
  );
export const serviceCapabilities = () => ({
  email: emailAvailable(),
  sms: Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM,
  ),
  billing: Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ESSENTIAL,
  ),
  invitation: true,
});
export async function deliver(input: {
  channel: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
  idempotencyKey: string;
  demo: boolean;
  /**
   * RFC 8058 unsubscribe headers, for update mail only. Transactional mail —
   * the invitation, RSVP confirmations, verification codes — passes nothing
   * here on purpose; see `src/lib/unsubscribe.ts`.
   */
  headers?: Record<string, string>;
}) {
  if (
    input.demo ||
    (!emailAvailable() && input.channel === "email") ||
    (!process.env.TWILIO_ACCOUNT_SID && input.channel === "sms")
  )
    return { status: "development", provider_id: null };
  if (
    input.channel === "email" &&
    process.env.AGENTMAIL_API_KEY &&
    process.env.AGENTMAIL_INBOX_ID &&
    !process.env.RESEND_API_KEY
  ) {
    const response = await fetch(
      `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(process.env.AGENTMAIL_INBOX_ID)}/messages/send`,
      {
        method: "POST",
        signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${process.env.AGENTMAIL_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify({
          to: [input.to],
          subject: input.subject,
          text: input.body,
        }),
      },
    );
    if (!response.ok)
      throw await refusal(
        response,
        "Email could not be sent. Please try again shortly.",
      );
    const result = await response.json();
    return { status: "sent", provider_id: result.message_id };
  }
  if (input.channel === "email") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
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
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        // Omitted entirely for transactional mail rather than sent empty.
        ...(input.headers ? { headers: input.headers } : {}),
      }),
    });
    if (!response.ok)
      throw await refusal(
        response,
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
    throw await refusal(
      response,
      "The SMS provider did not accept this message.",
    );
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
