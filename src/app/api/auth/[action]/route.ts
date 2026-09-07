import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, rows, transaction } from "@/lib/db";
import {
  currentUser,
  hash,
  HttpError,
  id,
  passwordHash,
  passwordMatches,
  rateLimit,
  requireUser,
  sameOrigin,
  session,
} from "@/lib/auth";
import { deliver } from "@/lib/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Enter your account details.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_000) {
      await reader.cancel();
      throw new HttpError(413, "This request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Please send valid account details.");
  }
}

async function handler(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    if (action === "me" && request.method === "GET")
      return json({ user: await currentUser() });
    if (request.method !== "POST") throw new HttpError(405, "Use POST.");
    sameOrigin(request);

    if (action === "logout") {
      const cookieStore = await cookies();
      const value = cookieStore.get("vow_session")?.value;
      if (value)
        await (
          await db()
        ).query("DELETE FROM sessions WHERE token_hash=$1", [hash(value)]);
      cookieStore.delete("vow_session");
      return json({ ok: true });
    }

    if (action === "verify-request") {
      const user = await requireUser();
      if (user.email_verified) return json({ ok: true, verified: true });
      if (user.is_demo)
        throw new HttpError(
          400,
          "Create your own account to collaborate on a wedding.",
        );
      await rateLimit("account-verification-request:" + user.id, 5);
      if (
        process.env.NODE_ENV === "production" &&
        !process.env.RESEND_API_KEY
      ) {
        throw new HttpError(
          503,
          "Email verification is not configured yet. Please try again later.",
        );
      }
      const challenge = id();
      const code = String(randomInt(100000, 1000000));
      await transaction(async (connection) => {
        await connection.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
          user.id,
        ]);
        await connection.query(
          "UPDATE account_verification_challenges SET consumed=true WHERE user_id=$1 AND consumed=false",
          [user.id],
        );
        await connection.query(
          "INSERT INTO account_verification_challenges(id,user_id,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes')",
          [challenge, user.id, passwordHash(code)],
        );
      });
      try {
        const delivery = await deliver({
          channel: "email",
          to: user.email,
          subject: "Verify your Vow Motion email",
          body: `Your verification code is ${code}. It expires in 10 minutes. Enter it in your Vow Motion account to access weddings shared with you.`,
          idempotencyKey: challenge,
          demo: false,
        });
        return json({
          ok: true,
          challenge,
          message: "Enter the verification code sent to your email address.",
          ...(delivery.status === "development" &&
          process.env.NODE_ENV !== "production"
            ? { development_code: code }
            : {}),
        });
      } catch (error) {
        await (
          await db()
        ).query(
          "UPDATE account_verification_challenges SET consumed=true WHERE id=$1",
          [challenge],
        );
        throw error;
      }
    }

    if (action === "verify-confirm") {
      const user = await requireUser();
      await rateLimit("account-verification-confirm:" + user.id, 30);
      const input = z
        .object({ challenge: z.uuid(), code: z.string().regex(/^\d{6}$/) })
        .parse(await readBody(request));
      const verified = await transaction(async (connection) => {
        await connection.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
          user.id,
        ]);
        // The conditional update holds the challenge lock until both its consumption
        // and the verified account state commit, including concurrent submissions.
        const challenge = (
          await connection.query<{ code_hash: string }>(
            "UPDATE account_verification_challenges SET attempts=attempts+1 WHERE id=$1 AND user_id=$2 AND consumed=false AND expires_at>now() AND attempts<5 RETURNING code_hash",
            [input.challenge, user.id],
          )
        ).rows[0];
        if (!challenge || !passwordMatches(input.code, challenge.code_hash))
          return false;
        await connection.query(
          "UPDATE account_verification_challenges SET consumed=true WHERE id=$1",
          [input.challenge],
        );
        await connection.query(
          "UPDATE users SET email_verified=true WHERE id=$1",
          [user.id],
        );
        return true;
      });
      if (!verified)
        throw new HttpError(
          400,
          "That code is incorrect or expired. Request a new one.",
        );
      return json({ ok: true, verified: true });
    }

    if (action !== "register" && action !== "login")
      throw new HttpError(404, "This action is unavailable.");
    await rateLimit("auth:" + request.headers.get("x-forwarded-for"), 30);
    const input = z
      .object({
        email: z.email().toLowerCase(),
        password: z.string().min(10).max(200),
        name: z.string().max(100).optional(),
        referral: z.string().max(100).optional(),
      })
      .parse(await readBody(request));
    if (action === "register") {
      const userId = id();
      await transaction(async (connection) => {
        await connection.query(
          "INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4)",
          [
            userId,
            input.email,
            input.name || input.email.split("@")[0],
            passwordHash(input.password),
          ],
        );
        if (input.referral)
          await connection.query(
            "INSERT INTO referrals(id,user_id,referred_by) VALUES($1,$2,$3)",
            [id(), userId, input.referral],
          );
      });
      await session(userId);
      return json({ ok: true });
    }
    const user = (
      await rows<{ id: string; password_hash: string }>(
        "SELECT id,password_hash FROM users WHERE email=$1 AND is_demo=false",
        [input.email],
      )
    )[0];
    if (!user || !passwordMatches(input.password, user.password_hash))
      throw new HttpError(401, "Email or password is incorrect.");
    await session(user.id);
    return json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        { error: error.issues.map((issue) => issue.message).join(" ") },
        400,
      );
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    )
      return json(
        {
          error: "An account with this email already exists. Sign in instead.",
        },
        409,
      );
    console.error(
      "Account request failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return json(
      {
        error: "We could not complete this account request. Please try again.",
      },
      500,
    );
  }
}

export const GET = handler;
export const POST = handler;
