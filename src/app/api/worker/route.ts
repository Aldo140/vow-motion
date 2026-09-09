import { NextRequest, NextResponse } from "next/server";
import { rows } from "@/lib/db";
import { sendMessage, MAX_ATTEMPTS } from "@/lib/messages";
export async function POST(req: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Three things are due, and they are one query because sendMessage() already
  // skips guests it has reached: a scheduled draft whose time has come; a send
  // holding a delivery whose backoff has elapsed; and a send that stalled
  // part-way through — the function timed out mid-loop and left the message
  // pinned at 'processing' with nobody coming back for it.
  const due = await rows(
    `SELECT DISTINCT m.id,m.wedding_id,w.owner_id,u.is_demo
       FROM messages m
       JOIN weddings w ON w.id=m.wedding_id
       JOIN users u ON u.id=w.owner_id
       LEFT JOIN deliveries d ON d.message_id=m.id
      WHERE (m.status='draft' AND m.scheduled_at<=now())
         OR (m.status IN ('failed','partially-failed')
             AND d.status='failed' AND d.attempts < $1
             AND d.next_attempt_at IS NOT NULL AND d.next_attempt_at<=now())
         OR (m.status='processing' AND m.updated_at < now() - interval '15 minutes')
      LIMIT 25`,
    [MAX_ATTEMPTS],
  );
  const results = [];
  for (const message of due) {
    try {
      results.push(
        await sendMessage(
          String(message.wedding_id),
          String(message.id),
          String(message.owner_id),
          Boolean(message.is_demo),
        ),
      );
    } catch (e) {
      results.push({ id: message.id, error: (e as Error).message });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}

export const GET = POST;
