import { db, rows, transaction } from "./db";
import { HttpError, id } from "./auth";
import { deliver, emailAvailable } from "./providers";

export const TRANSFER_EXPIRY_DAYS = 7;

export type PendingTransfer = {
  id: string;
  wedding_id: string;
  to_email: string;
  created_at: string;
  expires_at: string;
} | null;

export async function pendingTransferForWedding(
  weddingId: string,
): Promise<PendingTransfer> {
  return (
    (
      await rows<PendingTransfer & object>(
        "SELECT id,wedding_id,to_email,created_at,expires_at FROM ownership_transfers WHERE wedding_id=$1 AND status='pending' AND expires_at>now()",
        [weddingId],
      )
    )[0] || null
  );
}

/** What a recipient sees across every wedding, keyed by their own verified email. */
export async function pendingTransfersFor(email: string) {
  return rows<{
    id: string;
    wedding_id: string;
    names: string;
    from_user_id: string;
    created_at: string;
    expires_at: string;
  }>(
    `SELECT t.id,t.wedding_id,w.names,t.from_user_id,t.created_at,t.expires_at
     FROM ownership_transfers t JOIN weddings w ON w.id=t.wedding_id
     WHERE lower(t.to_email)=lower($1) AND t.status='pending' AND t.expires_at>now()
     ORDER BY t.created_at DESC`,
    [email],
  );
}

export async function initiateTransfer(
  weddingId: string,
  fromUserId: string,
  fromUserEmail: string,
  toEmail: string,
  weddingNames: string,
) {
  const normalized = toEmail.trim().toLowerCase();
  if (normalized === fromUserEmail.trim().toLowerCase())
    throw new HttpError(400, "Choose someone other than yourself.");
  const transferId = id();
  await transaction(async (connection) => {
    await connection.query(
      "UPDATE ownership_transfers SET status='cancelled',resolved_at=now() WHERE wedding_id=$1 AND status='pending'",
      [weddingId],
    );
    await connection.query(
      `INSERT INTO ownership_transfers(id,wedding_id,from_user_id,to_email,expires_at)
       VALUES($1,$2,$3,$4,now()+interval '${TRANSFER_EXPIRY_DAYS} days')`,
      [transferId, weddingId, fromUserId, normalized],
    );
  });
  if (emailAvailable())
    await deliver({
      channel: "email",
      to: normalized,
      subject: `You've been offered ownership of ${weddingNames}'s Vow Motion wedding`,
      body: `The current owner wants to transfer full ownership of "${weddingNames}" to this email address. Sign in (or create a free account with this exact email, then verify it) at Vow Motion and you'll see it waiting for you to accept or decline, in Studio → Settings.\n\nThis offer expires in ${TRANSFER_EXPIRY_DAYS} days. If you weren't expecting this, you can safely ignore it — nothing changes unless you accept.`,
      idempotencyKey: transferId,
      demo: false,
    }).catch(() => {});
  return pendingTransferForWedding(weddingId);
}

export async function cancelTransfer(weddingId: string) {
  const result = await (
    await db()
  ).query(
    "UPDATE ownership_transfers SET status='cancelled',resolved_at=now() WHERE wedding_id=$1 AND status='pending' RETURNING id",
    [weddingId],
  );
  if (!result.rows.length)
    throw new HttpError(404, "There is no pending transfer to cancel.");
}

async function resolveTransfer(
  transferId: string,
  userId: string,
  userEmail: string,
  emailVerified: boolean,
  outcome: "accepted" | "declined",
) {
  // Matches the collaborator-access pattern: an email only counts once the
  // account holding it has proven ownership by verifying it. Without this,
  // registering an unverified account with someone else's email would be
  // enough to steal a transfer meant for them.
  if (!emailVerified)
    throw new HttpError(
      403,
      "Verify your email address before accepting or declining a transfer.",
    );
  return transaction(async (connection) => {
    const claimed = await connection.query<{
      wedding_id: string;
      to_email: string;
    }>(
      "SELECT wedding_id,to_email FROM ownership_transfers WHERE id=$1 AND status='pending' AND expires_at>now() FOR UPDATE",
      [transferId],
    );
    const transfer = claimed.rows[0];
    if (!transfer) throw new HttpError(404, "That offer has expired or no longer exists.");
    if (transfer.to_email.toLowerCase() !== userEmail.trim().toLowerCase())
      throw new HttpError(403, "That offer was not made to your account.");
    await connection.query(
      "UPDATE ownership_transfers SET status=$1,resolved_at=now() WHERE id=$2",
      [outcome, transferId],
    );
    if (outcome === "accepted")
      await connection.query("UPDATE weddings SET owner_id=$1 WHERE id=$2", [
        userId,
        transfer.wedding_id,
      ]);
    return transfer.wedding_id;
  });
}

export const acceptTransfer = (
  transferId: string,
  userId: string,
  userEmail: string,
  emailVerified: boolean,
) => resolveTransfer(transferId, userId, userEmail, emailVerified, "accepted");
export const declineTransfer = (
  transferId: string,
  userId: string,
  userEmail: string,
  emailVerified: boolean,
) => resolveTransfer(transferId, userId, userEmail, emailVerified, "declined");
