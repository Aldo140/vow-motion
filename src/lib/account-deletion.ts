import { db, rows, transaction } from "./db";
import { HttpError, id } from "./auth";
import { deletePhoto } from "./photo-storage";

/** Guests get this long to change their mind, or find the request by mistake. */
export const DELETION_GRACE_DAYS = 14;

export type DeletionStatus = {
  id: string;
  requested_at: string;
  scheduled_for: string;
} | null;

export async function pendingDeletion(userId: string): Promise<DeletionStatus> {
  return (
    (
      await rows<DeletionStatus & object>(
        "SELECT id,requested_at,scheduled_for FROM account_deletion_requests WHERE user_id=$1 AND status='pending'",
        [userId],
      )
    )[0] || null
  );
}

export async function scheduleAccountDeletion(userId: string) {
  const existing = await pendingDeletion(userId);
  if (existing) return existing;
  const requestId = id();
  await (
    await db()
  ).query(
    `INSERT INTO account_deletion_requests(id,user_id,scheduled_for)
     VALUES($1,$2,now()+interval '${DELETION_GRACE_DAYS} days')`,
    [requestId, userId],
  );
  return pendingDeletion(userId);
}

export async function cancelAccountDeletion(userId: string) {
  const result = await (
    await db()
  ).query(
    "UPDATE account_deletion_requests SET status='cancelled',cancelled_at=now() WHERE user_id=$1 AND status='pending' RETURNING id",
    [userId],
  );
  if (!result.rows.length)
    throw new HttpError(404, "There is no pending deletion to cancel.");
}

/**
 * Deletes exactly what the README's manual procedure documents, in the same
 * order, plus queuing the photo files those weddings referenced so they are
 * not left behind. Called only for requests whose grace period has elapsed.
 */
export async function completeAccountDeletion(requestId: string, userId: string) {
  await transaction(async (connection) => {
    const claimed = await connection.query(
      "UPDATE account_deletion_requests SET status='completed',completed_at=now() WHERE id=$1 AND user_id=$2 AND status='pending' RETURNING id",
      [requestId, userId],
    );
    if (!claimed.rows.length) return;
    const photos = await connection.query<{ filename: string }>(
      `SELECT p.filename FROM photos p JOIN weddings w ON w.id = p.wedding_id
       WHERE w.owner_id = $1`,
      [userId],
    );
    for (const photo of photos.rows)
      await connection.query(
        "INSERT INTO pending_file_deletions(id,filename) VALUES($1,$2)",
        [id(), photo.filename],
      );
    const user = await connection.query<{ email: string }>(
      "SELECT email FROM users WHERE id=$1",
      [userId],
    );
    await connection.query("DELETE FROM weddings WHERE owner_id=$1", [userId]);
    if (user.rows[0])
      await connection.query(
        "DELETE FROM collaborators WHERE lower(email)=lower($1)",
        [user.rows[0].email],
      );
    await connection.query("DELETE FROM referrals WHERE user_id=$1", [userId]);
    await connection.query("DELETE FROM audit_log WHERE actor_id=$1", [userId]);
    await connection.query("DELETE FROM users WHERE id=$1", [userId]);
  });
}

/** Called by the authenticated worker. Bounded so one run cannot time out. */
export async function processDueAccountDeletions(limit = 20) {
  const due = await rows<{ id: string; user_id: string }>(
    "SELECT id,user_id FROM account_deletion_requests WHERE status='pending' AND scheduled_for<=now() ORDER BY scheduled_for LIMIT $1",
    [limit],
  );
  let completed = 0;
  const failures: { id: string; error: string }[] = [];
  for (const request of due) {
    try {
      await completeAccountDeletion(request.id, request.user_id);
      completed++;
    } catch (error) {
      failures.push({ id: request.id, error: (error as Error).message });
    }
  }
  return { completed, failures };
}

const MAX_FILE_DELETION_ATTEMPTS = 5;

/** Retries failed deletes with an operator-visible failure state, instead of silently giving up. */
export async function processPendingFileDeletions(limit = 50) {
  const due = await rows<{ id: string; filename: string; attempts: number }>(
    "SELECT id,filename,attempts FROM pending_file_deletions WHERE completed_at IS NULL AND attempts<$1 ORDER BY created_at LIMIT $2",
    [MAX_FILE_DELETION_ATTEMPTS, limit],
  );
  let deleted = 0;
  const failures: { id: string; error: string }[] = [];
  for (const item of due) {
    try {
      await deletePhoto(item.filename);
      await (
        await db()
      ).query(
        "UPDATE pending_file_deletions SET completed_at=now() WHERE id=$1",
        [item.id],
      );
      deleted++;
    } catch (error) {
      const message = (error as Error).message;
      await (
        await db()
      ).query(
        "UPDATE pending_file_deletions SET attempts=attempts+1,last_error=$1 WHERE id=$2",
        [message.slice(0, 500), item.id],
      );
      failures.push({ id: item.id, error: message });
    }
  }
  return { deleted, failures };
}
