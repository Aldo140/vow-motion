import { rows, transaction } from "./db";
import {
  publishToInstagram,
  refreshInstagramToken,
  activeInstagramToken,
  instagramConfigured,
  type MediaItem,
} from "./instagram";

const MAX_ATTEMPTS = 3;

export async function listSocialPosts() {
  return rows(
    `SELECT id, platform, caption, media, kind, status, scheduled_at, attempts,
       permalink, error, created_at, updated_at, posted_at
     FROM social_posts ORDER BY
       COALESCE(scheduled_at, created_at) DESC, created_at DESC
     LIMIT 200`,
  );
}

/**
 * Worker step: publish every post whose scheduled time has arrived. Mirrors the
 * message-send worker — claim the row, publish, record the outcome, and cap
 * retries so a permanently broken post does not loop forever.
 */
export async function publishDuePosts() {
  if (!instagramConfigured()) return { published: 0, failed: 0, skipped: 0 };

  const due = await rows<{
    id: string;
    caption: string;
    media: MediaItem[];
    kind: "image" | "carousel" | "reel";
  }>(
    `SELECT id, caption, media, kind FROM social_posts
     WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= now()
       AND attempts < $1
     ORDER BY scheduled_at LIMIT 5`,
    [MAX_ATTEMPTS],
  );

  let published = 0;
  let failed = 0;
  for (const post of due) {
    // Claim it so a second worker run cannot double-post.
    const claimed = await transaction(async (c) => {
      const r = await c.query(
        "UPDATE social_posts SET status='publishing', attempts=attempts+1, updated_at=now() WHERE id=$1 AND status='scheduled' RETURNING id",
        [post.id],
      );
      return r.rows.length > 0;
    });
    if (!claimed) continue;

    try {
      const result = await publishToInstagram({
        caption: post.caption,
        media: Array.isArray(post.media) ? post.media : [],
        kind: post.kind,
      });
      await rows(
        "UPDATE social_posts SET status='posted', permalink=$2, error=NULL, posted_at=now(), updated_at=now() WHERE id=$1",
        [post.id, result.permalink],
      );
      published++;
    } catch (error) {
      const message = (error as Error).message.slice(0, 500);
      await rows(
        `UPDATE social_posts
           SET status=CASE WHEN attempts >= $3 THEN 'failed' ELSE 'scheduled' END,
               error=$2, updated_at=now()
         WHERE id=$1`,
        [post.id, message, MAX_ATTEMPTS],
      );
      failed++;
    }
  }
  return { published, failed, skipped: 0 };
}

/**
 * Worker step: keep the Instagram token alive. On the first run it copies the
 * seed token from the environment into social_tokens; after that it refreshes
 * roughly two weeks before the 60-day token would expire.
 */
export async function maybeRefreshInstagramToken() {
  if (!instagramConfigured() || !(await activeInstagramToken())) return null;

  const [row] = await rows<{ expires_at: string }>(
    "SELECT expires_at FROM social_tokens WHERE id='instagram'",
  );

  if (!row) {
    // Seed the table from the environment token, assuming ~50 days left so the
    // next scheduled run performs the first real refresh.
    await rows(
      `INSERT INTO social_tokens(id, access_token, expires_at)
       VALUES('instagram', $1, now() + interval '50 days')
       ON CONFLICT(id) DO NOTHING`,
      [process.env.INSTAGRAM_ACCESS_TOKEN],
    );
    return "seeded";
  }

  const daysLeft =
    (new Date(row.expires_at).getTime() - Date.now()) / 86_400_000;
  if (daysLeft > 14) return "healthy";

  const refreshed = await refreshInstagramToken();
  if (!refreshed) return "refresh-failed";
  await rows(
    "UPDATE social_tokens SET access_token=$1, expires_at=$2, refreshed_at=now() WHERE id='instagram'",
    [refreshed.access_token, refreshed.expires_at.toISOString()],
  );
  return "refreshed";
}
