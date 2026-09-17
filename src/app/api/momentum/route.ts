import { NextResponse } from "next/server";
import {
  HttpError,
  requireAdmin,
  requireUser,
  rateLimit,
  sameOrigin,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { momentumReport } from "@/lib/momentum-report";
import { readJson } from "@/lib/request-body";
import { telemetrySchema } from "@/lib/momentum-telemetry";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser();
    await rateLimit("momentum:" + user.id, 600);
    const result = telemetrySchema.safeParse(await readJson(request, 2048));
    if (!result.success)
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    await (
      await db()
    ).query(
      "INSERT INTO momentum_events(event,properties,demo) VALUES($1,$2::jsonb,$3)",
      [result.data.event, JSON.stringify(result.data), user.is_demo],
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Event unavailable" },
      { status: error instanceof HttpError ? error.status : 500 },
    );
  }
}

/** Operator-only aggregate report. Individual events are never a public feed. */
export async function GET() {
  try {
    await requireAdmin();
    const report = await momentumReport();
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Not available" },
      { status: error instanceof HttpError ? error.status : 500 },
    );
  }
}
