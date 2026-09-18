import { NextRequest, NextResponse } from "next/server";
import { rows, transaction } from "@/lib/db";
import { sendMessage, MAX_ATTEMPTS } from "@/lib/messages";
import { publishDuePosts, maybeRefreshInstagramToken } from "@/lib/social";
import { id } from "@/lib/auth";
import {
  processDueAccountDeletions,
  processPendingFileDeletions,
} from "@/lib/account-deletion";
export async function POST(req: NextRequest) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== "Bearer " + process.env.CRON_SECRET
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Three things are due, and they are one query because sendMessage() already
  // skips guests it has reached: a scheduled draft whose time has come; a send
  // holding a delivery whose backoff has elapsed; and a send that stalled
  // part-way through — the function timed out mid-loop and left the message
  // pinned at 'processing' with nobody coming back for it.
  const due = await rows(
    `SELECT DISTINCT m.id,m.wedding_id,w.owner_id,u.is_demo
       FROM messages m
       JOIN weddings w ON w.id=m.wedding_id
       JOIN users u ON u.id=w.owner_id
       LEFT JOIN deliveries d ON d.message_id=m.id
      WHERE (m.status='draft' AND m.scheduled_at<=now())
         OR (m.status IN ('failed','partially-failed')
             AND d.status='failed' AND d.attempts < $1
             AND d.next_attempt_at IS NOT NULL AND d.next_attempt_at<=now())
         OR (m.status='processing' AND m.updated_at < now() - interval '15 minutes')
      LIMIT 25`,
    [MAX_ATTEMPTS],
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

  // Expired credentials and throttling rows have no product value. Cleaning
  // them during the authenticated worker run keeps retention deterministic
  // without introducing a second scheduler or a public maintenance endpoint.
  const cleanup = await transaction(async (connection) => {
    const sessions = await connection.query(
      "DELETE FROM sessions WHERE expires_at < now() RETURNING token_hash",
    );
    const invitationTokens = await connection.query(
      "DELETE FROM invitation_tokens WHERE expires_at < now() RETURNING id",
    );
    const lookupChallenges = await connection.query(
      "DELETE FROM verification_challenges WHERE expires_at < now() - interval '7 days' RETURNING id",
    );
    const accountChallenges = await connection.query(
      "DELETE FROM account_verification_challenges WHERE expires_at < now() - interval '7 days' RETURNING id",
    );
    const resetChallenges = await connection.query(
      "DELETE FROM password_reset_challenges WHERE expires_at < now() - interval '7 days' RETURNING id",
    );
    const storySessions = await connection.query(
      "DELETE FROM story_sessions WHERE expires_at < now() RETURNING token_hash",
    );
    const limits = await connection.query(
      "DELETE FROM rate_limits WHERE expires_at < now() RETURNING key",
    );
    // Marked expired rather than deleted — same as a completed account
    // deletion request, this is a meaningful record that an offer was made
    // and never answered, not just throttling noise.
    const staleTransfers = await connection.query(
      "UPDATE ownership_transfers SET status='expired',resolved_at=now() WHERE status='pending' AND expires_at<now() RETURNING id",
    );

    // Demo explore sessions accumulate one throwaway account per visitor and
    // never come back. After a week they are pure noise in the operator
    // dashboard, so retire them: their weddings (and everything cascading from
    // wedding_id) first, then the rows that reference the user without a
    // cascade, then the user — sessions and challenges cascade on that.
    const stale =
      "SELECT id FROM users WHERE is_demo AND created_at < now() - interval '7 days'";
    // Queue every file a demo wedding references — guest/design photos and its
    // public finder map — before the weddings that point to them disappear,
    // so nothing is orphaned on disk/blob storage.
    const stalePhotos = await connection.query<{ filename: string }>(
      `SELECT p.filename FROM photos p
       JOIN weddings w ON w.id = p.wedding_id
       WHERE w.owner_id IN (${stale})`,
    );
    const staleDesigns = await connection.query<{
      filename: string;
      original_filename: string;
    }>(
      `SELECT d.filename, d.original_filename FROM design_assets d
       JOIN weddings w ON w.id = d.wedding_id
       WHERE w.owner_id IN (${stale})`,
    );
    const staleFinderMaps = await connection.query<{ map: string }>(
      `SELECT settings->'finder'->>'map' AS map FROM weddings
       WHERE owner_id IN (${stale}) AND settings->'finder'->>'map' IS NOT NULL`,
    );
    for (const photo of stalePhotos.rows)
      await connection.query(
        "INSERT INTO pending_file_deletions(id,filename,reason) VALUES($1,$2,'demo_cleanup')",
        [id(), photo.filename],
      );
    for (const design of staleDesigns.rows) {
      await connection.query(
        "INSERT INTO pending_file_deletions(id,filename,reason) VALUES($1,$2,'demo_cleanup')",
        [id(), design.filename],
      );
      await connection.query(
        "INSERT INTO pending_file_deletions(id,filename,reason) VALUES($1,$2,'demo_cleanup')",
        [id(), design.original_filename],
      );
    }
    for (const finder of staleFinderMaps.rows)
      await connection.query(
        "INSERT INTO pending_file_deletions(id,filename,reason) VALUES($1,$2,'finder_map')",
        [id(), finder.map],
      );
    await connection.query(
      `DELETE FROM pilot_feedback WHERE author_id IN (${stale})`,
    );
    await connection.query(`DELETE FROM referrals WHERE user_id IN (${stale})`);
    await connection.query(`DELETE FROM weddings WHERE owner_id IN (${stale})`);
    const demoAccounts = await connection.query(
      "DELETE FROM users WHERE is_demo AND created_at < now() - interval '7 days' RETURNING id",
    );

    // Contact enquiries have no account of their own and no resolution
    // workflow, so a fixed retention window is the only practical limit —
    // long enough for business follow-up, short of holding them forever.
    const contactEnquiries = await connection.query(
      "DELETE FROM contact_enquiries WHERE created_at < now() - interval '2 years' RETURNING id",
    );

    return {
      sessions: sessions.rows.length,
      invitationTokens: invitationTokens.rows.length,
      challenges:
        lookupChallenges.rows.length +
        accountChallenges.rows.length +
        resetChallenges.rows.length,
      storySessions: storySessions.rows.length,
      rateLimits: limits.rows.length,
      demoAccounts: demoAccounts.rows.length,
      queuedFileDeletions:
        stalePhotos.rows.length +
        staleDesigns.rows.length * 2 +
        staleFinderMaps.rows.length,
      contactEnquiries: contactEnquiries.rows.length,
      expiredOwnershipTransfers: staleTransfers.rows.length,
    };
  });
  const accountDeletions = await processDueAccountDeletions().catch(
    (e) => ({ completed: 0, failures: [{ id: "n/a", error: (e as Error).message }] }),
  );
  const fileDeletions = await processPendingFileDeletions().catch(
    (e) => ({ deleted: 0, failures: [{ id: "n/a", error: (e as Error).message }] }),
  );
  // Brand social: refresh the Instagram token well before it lapses, then
  // publish any queued post whose scheduled time has arrived.
  const tokenState = await maybeRefreshInstagramToken().catch(
    (e) => `error: ${(e as Error).message}`,
  );
  const social = await publishDuePosts().catch((e) => ({
    published: 0,
    failed: 0,
    error: (e as Error).message,
  }));

  return NextResponse.json({
    processed: results.length,
    results,
    cleanup,
    accountDeletions,
    fileDeletions,
    social: { token: tokenState, ...social },
  });
}

export const GET = POST;
