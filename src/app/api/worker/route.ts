import { NextRequest, NextResponse } from "next/server";
import { rows } from "@/lib/db";
import { sendMessage } from "@/lib/messages";
export async function POST(req: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const due = await rows(
    "SELECT m.id,m.wedding_id,w.owner_id,u.is_demo FROM messages m JOIN weddings w ON w.id=m.wedding_id JOIN users u ON u.id=w.owner_id WHERE m.status='draft' AND m.scheduled_at<=now() LIMIT 25",
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
