import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
  randomUUID,
} from "node:crypto";
import { db, rows } from "./db";
export const id = () => randomUUID();
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function passwordMatches(password: string, stored: string) {
  try {
    const [salt, key] = stored.split(":");
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(key, "hex");
    return (
      expected.length === derived.length && timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}
export type User = {
  id: string;
  email: string;
  name: string;
  is_demo: boolean;
  email_verified: boolean;
  is_admin: boolean;
};
export async function currentUser(): Promise<User | null> {
  const value = (await cookies()).get("vow_session")?.value;
  if (!value) return null;
  return (
    (
      await rows<User>(
        "SELECT u.id,u.email,u.name,u.is_demo,u.email_verified,u.is_admin FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()",
        [hash(value)],
      )
    )[0] || null
  );
}
/** Addresses granted operator access by environment, lowercased. */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(/[,\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}
export function isAdmin(user: User | null): user is User {
  return (
    !!user &&
    (user.is_admin || adminEmails().includes(user.email.toLowerCase()))
  );
}
export async function requireAdmin() {
  const user = await currentUser();
  if (!isAdmin(user)) throw new HttpError(404, "Not found.");
  return user;
}
export async function session(userId: string) {
  const value = token();
  await (
    await db()
  ).query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
    [hash(value), userId],
  );
  (await cookies()).set("vow_session", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  return user;
}
export async function access(weddingId: string, write = false) {
  const user = await requireUser();
  const wedding = (
    await rows(
      "SELECT w.*,c.role collaborator_role FROM weddings w LEFT JOIN collaborators c ON c.wedding_id=w.id AND lower(c.email)=$2 AND $4=true WHERE w.id=$1 AND (w.owner_id=$3 OR c.id IS NOT NULL)",
      [weddingId, user.email.toLowerCase(), user.id, user.email_verified],
    )
  )[0];
  if (!wedding) throw new HttpError(404, "Wedding not found.");
  const role =
    wedding.owner_id === user.id ? "owner" : String(wedding.collaborator_role);
  if (write && role === "viewer")
    throw new HttpError(403, "Your access is view only.");
  return { user, wedding, role };
}
export async function audit(
  weddingId: string,
  actorId: string,
  action: string,
) {
  await (
    await db()
  ).query(
    "INSERT INTO audit_log(id,wedding_id,actor_id,action) VALUES($1,$2,$3,$4)",
    [id(), weddingId, actorId, action],
  );
}
export async function rateLimit(key: string, limit = 20) {
  const result = await (
    await db()
  ).query<{ count: number }>(
    "INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END,expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.expires_at END RETURNING count",
    [key],
  );
  if (result.rows[0].count > limit)
    throw new HttpError(
      429,
      "Too many attempts. Please try again in 15 minutes.",
    );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    origin &&
    new URL(origin).host !==
      (request.headers.get("host") || new URL(request.url).host) &&
    origin !== process.env.APP_URL
  )
    throw new HttpError(403, "This request could not be verified.");
}
