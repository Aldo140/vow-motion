/**
 * Pure day-of table finder helpers — safe to import from client components.
 * The database side (lookups, the guestbook) lives in `finder-data.ts`.
 */

export type FinderConfig = {
  enabled: boolean;
  always_on: boolean;
  map: string;
  notes: string;
  notes_es: string;
  welcome: string;
  welcome_es: string;
  tablemates: boolean;
  guestbook: boolean;
};

export function finderConfig(settings: unknown): FinderConfig {
  const f = (settings as { finder?: Partial<FinderConfig> })?.finder ?? {};
  return {
    enabled: f.enabled === true,
    always_on: f.always_on === true,
    map: typeof f.map === "string" ? f.map : "",
    notes: typeof f.notes === "string" ? f.notes : "",
    notes_es: typeof f.notes_es === "string" ? f.notes_es : "",
    welcome: typeof f.welcome === "string" ? f.welcome : "",
    welcome_es: typeof f.welcome_es === "string" ? f.welcome_es : "",
    tablemates: f.tablemates !== false,
    guestbook: f.guestbook !== false,
  };
}

/** Live between the day before and two days after, unless the couple pinned it on. */
export function finderActive(wedding: {
  settings: unknown;
  date: string;
  timezone: string;
}): boolean {
  const config = finderConfig(wedding.settings);
  if (!config.enabled) return false;
  if (config.always_on) return true;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: wedding.timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const midday = Date.parse(wedding.date + "T12:00:00Z");
  const from = new Date(midday - 86_400_000).toISOString().slice(0, 10);
  const to = new Date(midday + 2 * 86_400_000).toISOString().slice(0, 10);
  return today >= from && today <= to;
}
