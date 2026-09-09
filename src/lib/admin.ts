import { rows } from "./db";

/**
 * Everything the operator dashboard shows. One module, read-only aggregates,
 * scalar subqueries throughout so a user with many weddings and guests does not
 * multiply rows. "Real" everywhere means a signed-up account; demo explore
 * sessions (`users.is_demo`) are counted separately, never mixed into the
 * headline numbers. Timestamps come back as the driver's native value and are
 * formatted in the client with `new Date(String(value))`.
 */

export type AdminAccountRow = {
  id: string;
  email: string;
  name: string;
  is_demo: boolean;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string;
  weddings: number;
  guests: number;
  attending: number;
  declined: number;
  pending: number;
  first_wedding: string | null;
  first_wedding_status: string | null;
  last_activity: string | null;
  paid: boolean;
  plans: string | null;
};

export async function adminOverview() {
  const [
    [accounts],
    [weddings],
    [guests],
    [engagement],
    [commerce],
    signups,
    [funnel],
    accountRows,
    enquiries,
    activity,
  ] = await Promise.all([
    rows(`SELECT
        count(*) FILTER (WHERE NOT is_demo)                                            AS real_accounts,
        count(*) FILTER (WHERE is_demo)                                                AS demo_accounts,
        count(*) FILTER (WHERE NOT is_demo AND email_verified)                         AS verified_accounts,
        count(*) FILTER (WHERE is_admin)                                               AS admin_accounts,
        count(*) FILTER (WHERE NOT is_demo AND created_at > now() - interval '7 days')  AS signups_7d,
        count(*) FILTER (WHERE NOT is_demo AND created_at > now() - interval '30 days') AS signups_30d
      FROM users`),
    rows(`SELECT
        count(*)                                        AS total,
        count(*) FILTER (WHERE w.status='published')    AS published,
        count(*) FILTER (WHERE w.status='draft')        AS draft,
        count(*) FILTER (WHERE w.status='memories')     AS memories,
        count(*) FILTER (WHERE w.privacy='password')    AS password_protected
      FROM weddings w JOIN users u ON u.id=w.owner_id WHERE NOT u.is_demo`),
    rows(`SELECT
        count(*)                                              AS total,
        count(*) FILTER (WHERE g.status='attending')          AS attending,
        count(*) FILTER (WHERE g.status='declined')           AS declined,
        count(*) FILTER (WHERE g.status='pending')            AS pending,
        count(*) FILTER (WHERE g.consent)                     AS consented,
        count(*) FILTER (WHERE g.unsubscribed_at IS NOT NULL) AS unsubscribed
      FROM guests g JOIN weddings w ON w.id=g.wedding_id JOIN users u ON u.id=w.owner_id
      WHERE NOT u.is_demo`),
    rows(`SELECT
        (SELECT count(*) FROM invitation_tokens t JOIN weddings w ON w.id=t.wedding_id JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND t.preview=false)                            AS invites_issued,
        (SELECT count(*) FROM invitation_tokens t JOIN weddings w ON w.id=t.wedding_id JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND t.preview=false AND t.opened_at IS NOT NULL) AS invites_opened,
        (SELECT count(*) FROM guest_event_responses r
           JOIN guests g ON g.id=r.guest_id JOIN weddings w ON w.id=g.wedding_id JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo)                                                AS rsvp_responses,
        (SELECT count(*) FROM messages m JOIN weddings w ON w.id=m.wedding_id JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo)                                                AS messages,
        (SELECT count(*) FROM photos p JOIN weddings w ON w.id=p.wedding_id JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo)                                                AS photos`),
    rows(`SELECT
        (SELECT count(*) FROM subscriptions s JOIN weddings w ON w.id=s.wedding_id JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND s.status='paid')                            AS paid,
        (SELECT string_agg(line, ', ') FROM (
           SELECT s.plan || ' ×' || count(*) AS line
           FROM subscriptions s JOIN weddings w ON w.id=s.wedding_id JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND s.status='paid' GROUP BY s.plan ORDER BY s.plan) t) AS plan_mix,
        (SELECT count(*) FROM contact_enquiries)                               AS enquiries,
        (SELECT count(*) FROM contact_enquiries WHERE status NOT IN ('closed','resolved')) AS enquiries_open`),
    rows(`SELECT date_trunc('week', created_at) AS week, count(*) AS n
      FROM users WHERE NOT is_demo AND created_at > now() - interval '84 days'
      GROUP BY 1 ORDER BY 1`),
    rows(`SELECT
        (SELECT count(*) FROM users WHERE NOT is_demo) AS signed_up,
        (SELECT count(DISTINCT w.owner_id) FROM weddings w JOIN users u ON u.id=w.owner_id WHERE NOT u.is_demo) AS created_wedding,
        (SELECT count(DISTINCT w.owner_id) FROM weddings w JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND EXISTS(SELECT 1 FROM guests g WHERE g.wedding_id=w.id))             AS added_guests,
        (SELECT count(DISTINCT w.owner_id) FROM weddings w JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND w.status IN ('published','memories'))                               AS published,
        (SELECT count(DISTINCT w.owner_id) FROM weddings w JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND EXISTS(SELECT 1 FROM invitation_tokens t WHERE t.wedding_id=w.id AND t.preview=false)) AS sent_invites,
        (SELECT count(DISTINCT w.owner_id) FROM weddings w JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND EXISTS(
             SELECT 1 FROM guest_event_responses r JOIN guests g ON g.id=r.guest_id WHERE g.wedding_id=w.id)) AS got_rsvps,
        (SELECT count(DISTINCT w.owner_id) FROM weddings w JOIN users u ON u.id=w.owner_id
           WHERE NOT u.is_demo AND EXISTS(SELECT 1 FROM subscriptions s WHERE s.wedding_id=w.id AND s.status='paid')) AS paid`),
    rows<AdminAccountRow>(`SELECT
        u.id, u.email, u.name, u.is_demo, u.email_verified, u.is_admin, u.created_at,
        (SELECT count(*) FROM weddings w WHERE w.owner_id=u.id) AS weddings,
        (SELECT count(*) FROM guests g JOIN weddings w ON w.id=g.wedding_id WHERE w.owner_id=u.id) AS guests,
        (SELECT count(*) FROM guests g JOIN weddings w ON w.id=g.wedding_id WHERE w.owner_id=u.id AND g.status='attending') AS attending,
        (SELECT count(*) FROM guests g JOIN weddings w ON w.id=g.wedding_id WHERE w.owner_id=u.id AND g.status='declined') AS declined,
        (SELECT count(*) FROM guests g JOIN weddings w ON w.id=g.wedding_id WHERE w.owner_id=u.id AND g.status='pending') AS pending,
        (SELECT w.names FROM weddings w WHERE w.owner_id=u.id ORDER BY w.created_at LIMIT 1) AS first_wedding,
        (SELECT w.status FROM weddings w WHERE w.owner_id=u.id ORDER BY w.created_at LIMIT 1) AS first_wedding_status,
        (SELECT max(a.created_at) FROM audit_log a WHERE a.actor_id=u.id) AS last_activity,
        EXISTS(SELECT 1 FROM subscriptions s JOIN weddings w ON w.id=s.wedding_id WHERE w.owner_id=u.id AND s.status='paid') AS paid,
        (SELECT string_agg(DISTINCT s.plan, ', ') FROM subscriptions s JOIN weddings w ON w.id=s.wedding_id WHERE w.owner_id=u.id AND s.status='paid') AS plans
      FROM users u ORDER BY u.created_at DESC`),
    rows(`SELECT id, role, name, email, message, status, created_at
      FROM contact_enquiries ORDER BY created_at DESC LIMIT 60`),
    rows(`SELECT a.action, a.created_at, a.actor_id, w.id AS wedding_id, w.names, w.owner_id
      FROM audit_log a LEFT JOIN weddings w ON w.id=a.wedding_id
      ORDER BY a.created_at DESC LIMIT 40`),
  ]);

  return {
    accounts,
    weddings,
    guests,
    engagement,
    commerce,
    signups,
    funnel,
    accountRows,
    enquiries,
    activity,
    generatedAt: new Date().toISOString(),
  };
}

export type AdminOverview = Awaited<ReturnType<typeof adminOverview>>;

export async function adminAccount(userId: string) {
  const [user] = await rows(
    `SELECT id, email, name, is_demo, email_verified, is_admin, created_at
     FROM users WHERE id=$1`,
    [userId],
  );
  if (!user) return null;

  const [weddings, collaboratorOn, activity] = await Promise.all([
    rows(
      `SELECT
        w.id, w.names, w.slug, w.date, w.location, w.world, w.status, w.privacy,
        w.created_at, w.rsvp_deadline,
        (SELECT count(*) FROM households h WHERE h.wedding_id=w.id) AS households,
        (SELECT count(*) FROM guests g WHERE g.wedding_id=w.id) AS guests,
        (SELECT count(*) FROM guests g WHERE g.wedding_id=w.id AND g.status='attending') AS attending,
        (SELECT count(*) FROM guests g WHERE g.wedding_id=w.id AND g.status='declined') AS declined,
        (SELECT count(*) FROM guests g WHERE g.wedding_id=w.id AND g.status='pending') AS pending,
        (SELECT count(*) FROM guests g WHERE g.wedding_id=w.id AND g.consent) AS consented,
        (SELECT count(*) FROM events e WHERE e.wedding_id=w.id) AS events,
        (SELECT count(*) FROM invitation_tokens t WHERE t.wedding_id=w.id AND t.preview=false) AS invites_issued,
        (SELECT count(*) FROM invitation_tokens t WHERE t.wedding_id=w.id AND t.preview=false AND t.opened_at IS NOT NULL) AS invites_opened,
        (SELECT count(*) FROM messages m WHERE m.wedding_id=w.id) AS messages,
        (SELECT count(*) FROM deliveries d WHERE d.wedding_id=w.id) AS deliveries,
        (SELECT count(*) FROM deliveries d WHERE d.wedding_id=w.id AND d.status='bounced') AS bounced,
        (SELECT count(*) FROM photos p WHERE p.wedding_id=w.id) AS photos,
        (SELECT count(*) FROM guest_requests r WHERE r.wedding_id=w.id) AS guest_questions,
        (SELECT count(*) FROM pilot_feedback f WHERE f.wedding_id=w.id) AS feedback,
        (SELECT s.plan || ' · ' || s.status FROM subscriptions s WHERE s.wedding_id=w.id) AS subscription,
        (SELECT string_agg(c.email || ' (' || c.role || ')', ', ') FROM collaborators c WHERE c.wedding_id=w.id) AS collaborators,
        (SELECT string_agg(dm.hostname || ' [' || dm.status || ']', ', ') FROM domains dm WHERE dm.wedding_id=w.id) AS domains
      FROM weddings w WHERE w.owner_id=$1 ORDER BY w.created_at`,
      [userId],
    ),
    rows(
      `SELECT w.id, w.names, c.role FROM collaborators c
       JOIN weddings w ON w.id=c.wedding_id
       JOIN users u ON u.id=$1
       WHERE lower(c.email)=lower(u.email) AND w.owner_id<>$1
       ORDER BY w.created_at`,
      [userId],
    ),
    rows(
      `SELECT a.action, a.created_at, w.names
       FROM audit_log a LEFT JOIN weddings w ON w.id=a.wedding_id
       WHERE a.actor_id=$1 OR w.owner_id=$1
       ORDER BY a.created_at DESC LIMIT 50`,
      [userId],
    ),
  ]);

  return { user, weddings, collaboratorOn, activity };
}
