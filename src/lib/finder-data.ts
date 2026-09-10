import { rows } from "./db";
import { id } from "./auth";
import { finderConfig, finderActive } from "./finder";

/**
 * Database side of the day-of table finder. A guest at the venue opens
 * /f/<slug>, types their name, and gets their table, the people with them, and
 * what's next. Read-only apart from an optional note left for the couple.
 */

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

export async function finderData(slug: string) {
  const [wedding] = await rows<{
    id: string;
    slug: string;
    names: string;
    date: string;
    location: string;
    timezone: string;
    world: string;
    locale: string;
    settings: unknown;
  }>(
    `SELECT id, slug, names, date, location, timezone, world, locale, settings
     FROM weddings WHERE slug=$1`,
    [slug],
  );
  if (!wedding) return null;
  const config = finderConfig(wedding.settings);
  const active = finderActive(wedding);
  const events = active
    ? await rows(
        `SELECT id, title, title_es, starts_at, venue, dress_code
         FROM events WHERE wedding_id=$1 ORDER BY starts_at`,
        [wedding.id],
      )
    : [];
  return { wedding, config, active, events };
}

export async function lookupSeat(slug: string, query: string) {
  const q = normalize(query);
  if (q.length < 2) return { found: false as const };
  const guests = await rows<{
    name: string;
    meal: string;
    table_id: string | null;
    table_name: string | null;
  }>(
    `SELECT g.name, g.meal, t.id AS table_id, t.name AS table_name
     FROM guests g
     JOIN weddings w ON w.id=g.wedding_id
     LEFT JOIN seat_assignments s ON s.guest_id=g.id
     LEFT JOIN seating_tables t ON t.id=s.table_id
     WHERE w.slug=$1 AND g.status='attending'`,
    [slug],
  );
  const matches = guests.filter((g) => {
    const n = normalize(g.name);
    return n.includes(q) || q.includes(n);
  });
  if (matches.length === 0) return { found: false as const };
  // An exact full-name match always wins; otherwise a single partial match is
  // safe, and several partial matches are fine only if they sit at one table.
  // Two "Ava"s at different tables can't be told apart from one word.
  const me =
    matches.find((g) => normalize(g.name) === q) ||
    (matches.length === 1 ? matches[0] : null) ||
    (new Set(matches.map((g) => g.table_id)).size === 1 ? matches[0] : null);
  if (!me) return { found: false as const, ambiguous: true as const };
  const first = me.name.trim().split(/\s+/)[0];
  const tablemates = me.table_id
    ? guests
        .filter((g) => g.table_id === me.table_id && g.name !== me.name)
        .map((g) => g.name.trim().split(/\s+/)[0])
        .sort((a, b) => a.localeCompare(b))
    : [];
  return {
    found: true as const,
    first_name: first,
    table: me.table_name,
    meal: me.meal || "",
    tablemates,
  };
}

export async function addGuestbookNote(
  weddingId: string,
  name: string,
  body: string,
) {
  await rows(
    "INSERT INTO guestbook_notes(id,wedding_id,guest_name,body) VALUES($1,$2,$3,$4)",
    [id(), weddingId, name.slice(0, 120), body.slice(0, 1000)],
  );
}
