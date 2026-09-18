import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { db, rows, transaction } from "@/lib/db";
import {
  clientIp,
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
import { readJson } from "@/lib/request-body";
import { deliver, emailAvailable } from "@/lib/providers";
import {
  cancelAccountDeletion,
  pendingDeletion,
  scheduleAccountDeletion,
} from "@/lib/account-deletion";
import { exportAccountData } from "@/lib/account-export";
import {
  beginMfaSetup,
  confirmMfaSetup,
  createLoginChallenge,
  disableMfa,
  hasRecentReauth,
  markRecentReauth,
  mfaStatus,
  resolveLoginChallenge,
  verifyMfaCode,
} from "@/lib/mfa";
import {
  acceptTransfer,
  declineTransfer,
  pendingTransfersFor,
} from "@/lib/ownership-transfer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function handler(request: NextRequest, context: Context) {
  try {
    const { action } = await context.params;
    if (action === "me" && request.method === "GET") {
      const user = await currentUser();
      return json({
        user,
        deletion: user ? await pendingDeletion(user.id) : null,
        mfa: user ? await mfaStatus(user.id) : null,
        transfers:
          user && user.email_verified && !user.is_demo
            ? await pendingTransfersFor(user.email)
            : [],
      });
    }
    if (action === "export" && request.method === "GET") {
      const user = await requireUser();
      await rateLimit("account-export:" + user.id, 5);
      if (!(await hasRecentReauth(user.id)))
        throw new HttpError(
          401,
          "Confirm your password to export your data.",
        );
      const payload = await exportAccountData(user.id);
      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="vow-motion-data.json"',
          "Cache-Control": "no-store",
        },
      });
    }
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
      if (process.env.NODE_ENV === "production" && !emailAvailable()) {
        throw new HttpError(
          503,
          "Email verification is not configured yet. Please try again later.",
        );
      }
      const challenge = id();
      const code = String(randomInt(100000, 1000000));
      const codeHash = await passwordHash(code);
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
          [challenge, user.id, codeHash],
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
        .parse(await readJson(request, 16_000));
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
        if (
          !challenge ||
          !(await passwordMatches(input.code, challenge.code_hash))
        )
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

    if (action === "reset-request") {
      await rateLimit("reset-request:" + clientIp(request), 10);
      const input = z
        .object({ email: z.email().toLowerCase() })
        .parse(await readJson(request, 16_000));
      await rateLimit("reset-email:" + hash(input.email), 5);
      if (!emailAvailable() && process.env.NODE_ENV === "production")
        throw new HttpError(
          503,
          "Account recovery is temporarily unavailable. Please try again later.",
        );
      const user = (
        await rows<{ id: string; is_demo: boolean }>(
          "SELECT id,is_demo FROM users WHERE email=$1",
          [input.email],
        )
      )[0];
      const challenge = id(),
        code = String(randomInt(100000, 1000000));
      if (user && !user.is_demo) {
        const codeHash = await passwordHash(code);
        await transaction(async (connection) => {
          await connection.query(
            "SELECT id FROM users WHERE id=$1 FOR UPDATE",
            [user.id],
          );
          await connection.query(
            "UPDATE password_reset_challenges SET consumed=true WHERE user_id=$1",
            [user.id],
          );
          await connection.query(
            "INSERT INTO password_reset_challenges(id,user_id,code_hash,expires_at) VALUES($1,$2,$3,now()+interval '10 minutes')",
            [challenge, user.id, codeHash],
          );
        });
        try {
          await deliver({
            channel: "email",
            to: input.email,
            subject: "Reset your Vow Motion password",
            body: `Your password reset code is ${code}. It expires in 10 minutes. Enter it on the Vow Motion recovery page. If you did not request this, you can ignore this email.`,
            idempotencyKey: challenge,
            demo: false,
          });
        } catch {
          await (
            await db()
          ).query(
            "UPDATE password_reset_challenges SET consumed=true WHERE id=$1",
            [challenge],
          );
        }
      }
      return json({
        ok: true,
        challenge,
        message:
          "If an account matches that email, a recovery code is on its way.",
      });
    }
    if (action === "reset-confirm") {
      await rateLimit("reset-confirm:" + clientIp(request), 30);
      const input = z
        .object({
          challenge: z.uuid(),
          code: z.string().regex(/^\d{6}$/),
          password: z.string().min(10).max(200),
        })
        .parse(await readJson(request, 16_000));
      const result = await transaction(async (connection) => {
        const record = (
          await connection.query<{ user_id: string; code_hash: string }>(
            "UPDATE password_reset_challenges SET attempts=attempts+1 WHERE id=$1 AND consumed=false AND expires_at>now() AND attempts<5 RETURNING user_id,code_hash",
            [input.challenge],
          )
        ).rows[0];
        if (
          !record ||
          !(await passwordMatches(input.code, record.code_hash))
        )
          return false;
        await connection.query(
          "UPDATE password_reset_challenges SET consumed=true WHERE id=$1",
          [input.challenge],
        );
        await connection.query(
          "UPDATE users SET password_hash=$1,email_verified=true WHERE id=$2",
          [await passwordHash(input.password), record.user_id],
        );
        await connection.query("DELETE FROM sessions WHERE user_id=$1", [
          record.user_id,
        ]);
        return true;
      });
      if (!result)
        throw new HttpError(
          400,
          "That code is incorrect or expired. Request a new one.",
        );
      return json({ ok: true });
    }
    if (action === "deletion-request") {
      const user = await requireUser();
      await rateLimit("deletion-request:" + user.id, 5);
      if (user.is_demo)
        throw new HttpError(
          400,
          "Demo workspaces clear themselves automatically; there is nothing to delete.",
        );
      const input = z
        .object({
          password: z.string().min(1).max(200),
          code: z.string().max(20).optional(),
        })
        .parse(await readJson(request, 4_000));
      const stored = (
        await rows<{ password_hash: string }>(
          "SELECT password_hash FROM users WHERE id=$1",
          [user.id],
        )
      )[0];
      if (!stored || !(await passwordMatches(input.password, stored.password_hash)))
        throw new HttpError(401, "That password is incorrect.");
      if ((await mfaStatus(user.id)).enabled) {
        if (!input.code || !(await verifyMfaCode(user.id, input.code)))
          throw new HttpError(
            401,
            "Enter your current two-factor code to confirm this.",
          );
      }
      const deletion = await scheduleAccountDeletion(user.id);
      return json({ ok: true, deletion });
    }
    if (action === "deletion-cancel") {
      const user = await requireUser();
      await cancelAccountDeletion(user.id);
      return json({ ok: true });
    }
    if (action === "reauth") {
      const user = await requireUser();
      await rateLimit("reauth:" + user.id, 10);
      const input = z
        .object({
          password: z.string().min(1).max(200),
          code: z.string().max(20).optional(),
        })
        .parse(await readJson(request, 4_000));
      const stored = (
        await rows<{ password_hash: string }>(
          "SELECT password_hash FROM users WHERE id=$1",
          [user.id],
        )
      )[0];
      if (!stored || !(await passwordMatches(input.password, stored.password_hash)))
        throw new HttpError(401, "That password is incorrect.");
      if ((await mfaStatus(user.id)).enabled) {
        if (!input.code || !(await verifyMfaCode(user.id, input.code)))
          throw new HttpError(401, "Enter your current two-factor code.");
      }
      await markRecentReauth(user.id);
      return json({ ok: true });
    }
    if (action === "mfa-setup") {
      const user = await requireUser();
      await rateLimit("mfa-setup:" + user.id, 10);
      const { secret, otpauth_url } = await beginMfaSetup(user.id, user.email);
      const qr = await QRCode.toDataURL(otpauth_url, { margin: 2 });
      return json({ secret, otpauth_url, qr });
    }
    if (action === "mfa-confirm") {
      const user = await requireUser();
      await rateLimit("mfa-confirm:" + user.id, 10);
      const input = z
        .object({ code: z.string().regex(/^\d{6}$/) })
        .parse(await readJson(request, 4_000));
      const { backupCodes } = await confirmMfaSetup(user.id, input.code);
      return json({ ok: true, backupCodes });
    }
    if (action === "mfa-disable") {
      const user = await requireUser();
      await rateLimit("mfa-disable:" + user.id, 10);
      const input = z
        .object({
          password: z.string().min(1).max(200),
          code: z.string().max(20),
        })
        .parse(await readJson(request, 4_000));
      const stored = (
        await rows<{ password_hash: string }>(
          "SELECT password_hash FROM users WHERE id=$1",
          [user.id],
        )
      )[0];
      if (!stored || !(await passwordMatches(input.password, stored.password_hash)))
        throw new HttpError(401, "That password is incorrect.");
      if (!(await verifyMfaCode(user.id, input.code)))
        throw new HttpError(401, "That code is incorrect.");
      await disableMfa(user.id);
      return json({ ok: true });
    }
    if (action === "mfa-login-verify") {
      await rateLimit("mfa-login:" + clientIp(request), 20);
      const input = z
        .object({ challenge: z.uuid(), code: z.string().max(20) })
        .parse(await readJson(request, 4_000));
      const userId = await resolveLoginChallenge(input.challenge, input.code);
      await session(userId);
      return json({ ok: true });
    }
    if (action === "transfer-accept" || action === "transfer-decline") {
      const user = await requireUser();
      await rateLimit("transfer-resolve:" + user.id, 10);
      const input = z
        .object({ id: z.string().min(1) })
        .parse(await readJson(request, 4_000));
      const resolve = action === "transfer-accept" ? acceptTransfer : declineTransfer;
      const weddingId = await resolve(
        input.id,
        user.id,
        user.email,
        user.email_verified,
      );
      return json({ ok: true, weddingId });
    }
    if (action !== "register" && action !== "login")
      throw new HttpError(404, "This action is unavailable.");
    await rateLimit("auth:" + clientIp(request), 30);
    const input = z
      .object({
        email: z.email().toLowerCase(),
        password: z.string().min(10).max(200),
        name: z.string().max(100).optional(),
        referral: z.string().max(100).optional(),
      })
      .parse(await readJson(request, 16_000));
    if (action === "register") {
      const userId = id();
      const registerHash = await passwordHash(input.password);
      await transaction(async (connection) => {
        await connection.query(
          "INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,$4)",
          [
            userId,
            input.email,
            input.name || input.email.split("@")[0],
            registerHash,
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
    if (!user || !(await passwordMatches(input.password, user.password_hash)))
      throw new HttpError(401, "Email or password is incorrect.");
    if ((await mfaStatus(user.id)).enabled) {
      const challenge = await createLoginChallenge(user.id);
      return json({ ok: true, mfaRequired: true, challenge });
    }
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
