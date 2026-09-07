/** Format an instant as the wall-clock value a datetime-local input expects. */
export function localEventTime(instant: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Resolve local venue time without silently shifting a daylight-saving gap/overlap. */
export function eventInstant(local: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
    throw new Error("Choose a date and time for this event.");
  const wall = Date.parse(local + ":00Z");
  if (!Number.isFinite(wall)) throw new Error("Choose a valid date and time.");
  const offsets = new Set<number>();
  for (const hours of [-36, 0, 36]) {
    const sample = wall + hours * 3600000;
    offsets.add(
      Date.parse(
        localEventTime(new Date(sample).toISOString(), timezone) + ":00Z",
      ) - sample,
    );
  }
  const matches = [...offsets]
    .map((offset) => wall - offset)
    .filter(
      (candidate) =>
        localEventTime(new Date(candidate).toISOString(), timezone) === local,
    );
  if (!matches.length)
    throw new Error(
      "This time is skipped when the clocks change. Choose a time before or after the change.",
    );
  if (matches.length > 1)
    throw new Error(
      "This time happens twice when the clocks change. Choose a time outside the repeated hour.",
    );
  return new Date(matches[0]).toISOString();
}
