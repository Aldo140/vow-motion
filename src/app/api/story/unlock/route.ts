import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { rows, db } from "@/lib/db";
import {
  passwordMatches,
  hash,
  token,
  sameOrigin,
  rateLimit,
  HttpError,
} from "@/lib/auth";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    await rateLimit("story:" + request.headers.get("x-forwarded-for"), 20);
    const input = z
      .object({ slug: z.string().max(200), password: z.string().max(200) })
      .parse(await request.json());
    const wedding = (
      await rows(
        "SELECT id,password_hash FROM weddings WHERE slug=$1 AND privacy='password' AND status<>'draft'",
        [input.slug],
      )
    )[0];
    if (
      !wedding ||
      !passwordMatches(input.password, String(wedding.password_hash))
    )
      throw new HttpError(
        401,
        "The password did not match. Please check with your hosts.",
      );
    const value = token();
    await (
      await db()
    ).query(
      "INSERT INTO story_sessions(token_hash,wedding_id,password_version,expires_at) VALUES($1,$2,$3,now()+interval '1 day')",
      [hash(value), wedding.id, hash(String(wedding.password_hash))],
    );
    (await cookies()).set("vow_story_" + wedding.id, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/w/",
      maxAge: 86400,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof HttpError
            ? e.message
            : "Please check the password and try again.",
      },
      { status: e instanceof HttpError ? e.status : 400 },
    );
  }
}
