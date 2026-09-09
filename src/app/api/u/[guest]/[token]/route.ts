import { NextRequest, NextResponse } from "next/server";
import { db, rows } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe, both verbs on one URL.
 *
 * `POST` is what a mailbox provider calls when the guest presses the
 * unsubscribe affordance Gmail draws next to the sender name. RFC 8058 requires
 * it to work with no further interaction from the guest, so there is no
 * confirmation step and no body to read. `GET` is what a human clicking the
 * link in the message body gets: the same withdrawal, plus a page that says so.
 */

const COPY = {
  en: {
    title: "You have been unsubscribed",
    body: "You will no longer receive email updates about this wedding. Your invitation, and everything on it, still works exactly as before.",
    already: "You were already unsubscribed. Nothing further will be sent.",
    invalid: "This unsubscribe link is not valid.",
    invalidBody:
      "It may have been altered in transit. Reply to the message you received and whoever sent it can remove you directly.",
  },
  es: {
    title: "Se ha dado de baja",
    body: "Ya no recibirá correos con novedades sobre esta boda. Su invitación, y todo lo que contiene, sigue funcionando igual que antes.",
    already: "Ya estaba dado de baja. No se enviará nada más.",
    invalid: "Este enlace para darse de baja no es válido.",
    invalidBody:
      "Puede que se haya modificado. Responda al mensaje que recibió y quien se lo envió podrá darle de baja directamente.",
  },
};

function page(language: string, heading: string, body: string, status = 200) {
  const lang = language === "es" ? "es" : "en";
  return new NextResponse(
    `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${heading}</title>
<style>
:root{color-scheme:light}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:2rem;
background:#f7f4ef;color:#2b2622;
font:400 1rem/1.6 ui-serif,Georgia,"Times New Roman",serif}
main{max-width:32rem;text-align:center}
h1{font-size:1.5rem;font-weight:400;letter-spacing:.01em;margin:0 0 .75rem}
p{margin:0;color:#5d554d}
</style></head><body><main><h1>${heading}</h1><p>${body}</p></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/** Returns the guest's language, or null when the token does not verify. */
async function withdraw(guestId: string, token: string) {
  if (!verifyUnsubscribeToken(guestId, token)) return null;
  const guest = (
    await rows<{ language: string; unsubscribed_at: string | null }>(
      "SELECT language,unsubscribed_at FROM guests WHERE id=$1",
      [guestId],
    )
  )[0];
  // Do not distinguish "bad token" from "no such guest" in the response: the
  // token is the only proof of identity this endpoint has.
  if (!guest) return null;
  const already = Boolean(guest.unsubscribed_at);
  if (!already)
    await (
      await db()
    ).query(
      `UPDATE guests SET consent=false, unsubscribed_at=now(),
         suppressed_reason=COALESCE(suppressed_reason,'unsubscribed') WHERE id=$1`,
      [guestId],
    );
  return { language: String(guest.language || "en"), already };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ guest: string; token: string }> },
) {
  const { guest, token } = await params;
  const result = await withdraw(guest, token);
  // RFC 8058: 200 and an empty body. The provider is not showing this to anyone.
  return result
    ? new NextResponse(null, { status: 200 })
    : new NextResponse(null, { status: 400 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guest: string; token: string }> },
) {
  const { guest, token } = await params;
  const result = await withdraw(guest, token);
  if (!result) {
    const copy = COPY.en;
    return page("en", copy.invalid, copy.invalidBody, 400);
  }
  const copy = COPY[result.language === "es" ? "es" : "en"];
  return page(
    result.language,
    copy.title,
    result.already ? copy.already : copy.body,
  );
}
