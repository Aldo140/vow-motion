import { rows } from "./db";
import { hash } from "./auth";
import { cookies } from "next/headers";
export function safeWedding<T extends Record<string, unknown>>(record: T) {
  const copy = { ...record };
  delete copy.password_hash;
  delete copy.collaborator_role;
  return copy;
}
export async function listWeddings(userId: string) {
  return (
    await rows(
      "SELECT DISTINCT w.* FROM weddings w LEFT JOIN collaborators c ON c.wedding_id=w.id JOIN users u ON u.id=$1 WHERE w.owner_id=u.id OR (u.email_verified=true AND lower(c.email)=lower(u.email)) ORDER BY w.created_at",
      [userId],
    )
  ).map(safeWedding);
}
export async function storyUnlocked(weddingId: string, passwordHash: string) {
  const raw = (await cookies()).get("vow_story_" + weddingId)?.value;
  if (!raw) return false;
  return (
    (
      await rows(
        "SELECT token_hash FROM story_sessions WHERE token_hash=$1 AND wedding_id=$2 AND password_version=$3 AND expires_at>now()",
        [hash(raw), weddingId, hash(passwordHash)],
      )
    ).length > 0
  );
}
