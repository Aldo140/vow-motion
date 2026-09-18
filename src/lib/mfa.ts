import { db, rows, transaction, type Database } from "./db";
import { HttpError, hash, id } from "./auth";
import {
  generateBackupCodes,
  generateTotpSecret,
  otpAuthUrl,
  verifyTotp,
} from "./totp";

export const LOGIN_CHALLENGE_MINUTES = 5;

export async function mfaStatus(userId: string) {
  const row = (
    await rows<{ enabled: boolean }>(
      "SELECT enabled FROM user_mfa WHERE user_id=$1",
      [userId],
    )
  )[0];
  return { enabled: Boolean(row?.enabled) };
}

/** Starts (or restarts) enrollment. Not active until confirmSetup succeeds. */
export async function beginMfaSetup(userId: string, email: string) {
  const secret = generateTotpSecret();
  await (
    await db()
  ).query(
    `INSERT INTO user_mfa(user_id,secret,enabled,backup_codes,confirmed_at)
     VALUES($1,$2,false,'[]',NULL)
     ON CONFLICT(user_id) DO UPDATE SET secret=$2,enabled=false,backup_codes='[]',confirmed_at=NULL
     WHERE user_mfa.enabled=false`,
    [userId, secret],
  );
  const row = (
    await rows<{ secret: string; enabled: boolean }>(
      "SELECT secret, enabled FROM user_mfa WHERE user_id=$1",
      [userId],
    )
  )[0];
  if (!row || row.enabled)
    throw new HttpError(
      400,
      "Two-factor authentication is already on. Turn it off before setting up a new device.",
    );
  return { secret: row.secret, otpauth_url: otpAuthUrl(row.secret, email) };
}

/** Confirms the device is correctly enrolled, then issues one-time backup codes. */
export async function confirmMfaSetup(userId: string, code: string) {
  const row = (
    await rows<{ secret: string; enabled: boolean }>(
      "SELECT secret, enabled FROM user_mfa WHERE user_id=$1",
      [userId],
    )
  )[0];
  if (!row || row.enabled)
    throw new HttpError(400, "Start two-factor setup again before confirming.");
  if (!verifyTotp(row.secret, code))
    throw new HttpError(400, "That code is incorrect. Check your authenticator app and try again.");
  const codes = generateBackupCodes();
  await (
    await db()
  ).query(
    "UPDATE user_mfa SET enabled=true,confirmed_at=now(),backup_codes=$1 WHERE user_id=$2",
    [JSON.stringify(codes.map((c) => ({ hash: hash(c), used_at: null }))), userId],
  );
  return { backupCodes: codes };
}

export async function disableMfa(userId: string) {
  await (await db()).query("DELETE FROM user_mfa WHERE user_id=$1", [userId]);
}

type BackupCode = { hash: string; used_at: string | null };

/**
 * A TOTP code or an unused backup code, either one proves possession for this
 * login/action. Takes the caller's own transaction connection — never opens
 * its own — because this project's db helpers share one global serialization
 * queue, and a `transaction()` opened from inside another's callback would
 * wait on a queue slot that the outer transaction is itself blocking.
 * Locks the user's MFA row for the call so two concurrent attempts can never
 * both consume the same one-time backup code.
 */
async function verifyMfaCodeOn(
  connection: Database,
  userId: string,
  code: string,
): Promise<boolean> {
  const row = (
    await connection.query<{ secret: string; backup_codes: BackupCode[] }>(
      "SELECT secret, backup_codes FROM user_mfa WHERE user_id=$1 AND enabled=true FOR UPDATE",
      [userId],
    )
  ).rows[0];
  if (!row) return false;
  if (verifyTotp(row.secret, code)) return true;
  const normalized = code.trim().toUpperCase();
  const codeHash = hash(normalized);
  const match = row.backup_codes.find((c) => c.hash === codeHash && !c.used_at);
  if (!match) return false;
  await connection.query(
    `UPDATE user_mfa SET backup_codes = (
       SELECT jsonb_agg(CASE WHEN elem->>'hash'=$1 THEN jsonb_set(elem,'{used_at}',to_jsonb(now()::text)) ELSE elem END)
       FROM jsonb_array_elements(backup_codes) elem
     ) WHERE user_id=$2`,
    [codeHash, userId],
  );
  return true;
}

/** Standalone entry point for callers that are not already inside a transaction. */
export async function verifyMfaCode(userId: string, code: string): Promise<boolean> {
  return transaction((connection) => verifyMfaCodeOn(connection, userId, code));
}

export const REAUTH_MINUTES = 10;

/** Marks the user as freshly reauthenticated, for step-up actions (like a full
 * data export) that are a GET request and so cannot themselves carry a
 * password or MFA code. */
export async function markRecentReauth(userId: string) {
  await (
    await db()
  ).query(
    `INSERT INTO recent_reauth(user_id,verified_at) VALUES($1,now())
     ON CONFLICT(user_id) DO UPDATE SET verified_at=now()`,
    [userId],
  );
}

export async function hasRecentReauth(userId: string) {
  const row = (
    await rows<{ ok: boolean }>(
      `SELECT verified_at > now() - interval '${REAUTH_MINUTES} minutes' ok FROM recent_reauth WHERE user_id=$1`,
      [userId],
    )
  )[0];
  return Boolean(row?.ok);
}

export async function createLoginChallenge(userId: string) {
  const challengeId = id();
  await (
    await db()
  ).query(
    `INSERT INTO mfa_login_challenges(id,user_id,expires_at) VALUES($1,$2,now()+interval '${LOGIN_CHALLENGE_MINUTES} minutes')`,
    [challengeId, userId],
  );
  return challengeId;
}

/** Consumes the challenge on success; a failed attempt just costs one of five tries. */
export async function resolveLoginChallenge(challengeId: string, code: string) {
  return transaction(async (connection) => {
    const claimed = await connection.query<{ user_id: string }>(
      "UPDATE mfa_login_challenges SET attempts=attempts+1 WHERE id=$1 AND expires_at>now() AND attempts<5 RETURNING user_id",
      [challengeId],
    );
    const userId = claimed.rows[0]?.user_id;
    if (!userId)
      throw new HttpError(400, "That code has expired. Please sign in again.");
    if (!(await verifyMfaCodeOn(connection, userId, code)))
      throw new HttpError(400, "That code is incorrect.");
    await connection.query("DELETE FROM mfa_login_challenges WHERE id=$1", [
      challengeId,
    ]);
    return userId;
  });
}
