import { serviceCapabilities } from "./providers";
import { rows } from "./db";
import { safeWedding, listWeddings } from "./wedding-access";
import { access, hash, HttpError } from "./auth";
import type { StudioData, GuestData } from "./types";
export async function studioData(weddingId: string): Promise<StudioData> {
  const { user, wedding, role } = await access(weddingId);
  const [
    weddings,
    guests,
    households,
    events,
    questions,
    travel,
    registry,
    messages,
    tables,
    photos,
    collaborators,
    domains,
    deliveries,
    activity,
  ] = await Promise.all([
    listWeddings(user.id),
    rows(
      "SELECT g.*,t.name table_name,t.id table_id FROM guests g LEFT JOIN seat_assignments s ON s.guest_id=g.id LEFT JOIN seating_tables t ON t.id=s.table_id WHERE g.wedding_id=$1 ORDER BY g.created_at,g.name",
      [weddingId],
    ),
    rows(
      "SELECT id,name FROM households WHERE wedding_id=$1 ORDER BY created_at",
      [weddingId],
    ),
    rows(
      "SELECT e.*,COALESCE((SELECT jsonb_agg(a.household_id) FROM event_guest_access a WHERE a.event_id=e.id),'[]'::jsonb) household_ids FROM events e WHERE wedding_id=$1 ORDER BY starts_at",
      [weddingId],
    ),
    ...[
      "rsvp_questions",
      "travel_items",
      "registry_links",
      "messages",
      "seating_tables",
      "photos",
      "collaborators",
      "domains",
      "deliveries",
    ].map((table) =>
      rows(`SELECT * FROM ${table} WHERE wedding_id=$1`, [weddingId]),
    ),
    rows(
      "SELECT id,action,created_at FROM audit_log WHERE wedding_id=$1 ORDER BY created_at DESC LIMIT 12",
      [weddingId],
    ),
  ]);
  return {
    user,
    wedding: safeWedding(wedding),
    weddings,
    guests,
    households,
    events,
    questions,
    travel,
    registry,
    messages,
    tables,
    photos,
    collaborators,
    domains,
    deliveries,
    activity,
    role,
    capabilities: serviceCapabilities(),
  } as unknown as StudioData;
}
export async function guestData(rawToken: string): Promise<GuestData> {
  if (rawToken.length < 32 || rawToken.length > 100)
    throw new HttpError(404, "This invitation is unavailable.");
  const invitation = (
    await rows(
      "SELECT * FROM invitation_tokens WHERE token_hash=$1 AND revoked=false AND expires_at>now()",
      [hash(rawToken)],
    )
  )[0];
  if (!invitation)
    throw new HttpError(
      404,
      "This invitation has expired or is unavailable. Please contact your hosts for a new link.",
    );
  const weddingId = String(invitation.wedding_id),
    householdId = String(invitation.household_id);
  const [
    weddings,
    guests,
    events,
    questions,
    travel,
    registry,
    photos,
    responses,
    households,
    updates,
  ] = await Promise.all([
    rows(
      "SELECT id,slug,names,date,location,timezone,world,opening,privacy,story,locale,status,rsvp_deadline,settings FROM weddings WHERE id=$1",
      [weddingId],
    ),
    rows(
      "SELECT g.id,g.household_id,g.name,g.email,g.phone,g.address,g.language,g.status,g.meal,g.dietary,g.is_plus_one,g.consent,t.name table_name FROM guests g LEFT JOIN seat_assignments s ON s.guest_id=g.id LEFT JOIN seating_tables t ON t.id=s.table_id WHERE g.household_id=$1",
      [householdId],
    ),
    rows(
      "SELECT e.* FROM events e WHERE e.wedding_id=$1 AND (e.visibility='all' OR EXISTS(SELECT 1 FROM event_guest_access a WHERE a.event_id=e.id AND a.household_id=$2)) ORDER BY starts_at",
      [weddingId, householdId],
    ),
    ...["rsvp_questions", "travel_items", "registry_links"].map((table) =>
      rows(`SELECT * FROM ${table} WHERE wedding_id=$1`, [weddingId]),
    ),
    rows(
      "SELECT id,caption,approved FROM photos WHERE wedding_id=$1 AND (approved=true OR household_id=$2)",
      [weddingId, householdId],
    ),
    rows(
      "SELECT r.* FROM guest_event_responses r JOIN guests g ON g.id=r.guest_id JOIN events e ON e.id=r.event_id WHERE g.household_id=$1 AND (e.visibility='all' OR EXISTS(SELECT 1 FROM event_guest_access a WHERE a.event_id=e.id AND a.household_id=$1))",
      [householdId],
    ),
    rows("SELECT name FROM households WHERE id=$1", [householdId]),
    rows(
      "SELECT DISTINCT m.id,m.subject,m.body,m.created_at,m.scheduled_at FROM messages m JOIN deliveries d ON d.message_id=m.id JOIN guests g ON g.id=d.guest_id WHERE m.wedding_id=$1 AND g.household_id=$2 AND m.channel='invitation' AND d.status='published' AND (m.scheduled_at IS NULL OR m.scheduled_at<=now()) ORDER BY m.created_at DESC",
      [weddingId, householdId],
    ),
  ]);
  return {
    wedding: weddings[0],
    guests,
    events,
    questions,
    travel,
    registry,
    photos,
    responses,
    household: households[0]?.name,
    updates,
    token: rawToken,
  } as unknown as GuestData;
}
