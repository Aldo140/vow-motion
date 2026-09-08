import { eventInstant } from "./event-time";

export const eventStarters = [
  {
    title: "Wedding ceremony",
    time: "16:00",
    duration: 60,
    day: 0,
    description: "Join us as we begin our next chapter together.",
  },
  {
    title: "Reception",
    time: "18:00",
    duration: 300,
    day: 0,
    description: "Dinner, dancing and a celebration with our favourite people.",
  },
  {
    title: "Welcome drinks",
    time: "18:00",
    duration: 120,
    day: -1,
    description: "A relaxed hello before the big day.",
  },
  {
    title: "Farewell brunch",
    time: "10:00",
    duration: 120,
    day: 1,
    description: "One more gathering before we say goodbye.",
  },
];

export function starterTimes(
  date: string,
  starter: (typeof eventStarters)[number],
) {
  const start = new Date(`${date}T${starter.time}:00Z`);
  if (Number.isNaN(start.getTime()))
    throw new Error("Choose the wedding date before using a starter.");
  start.setUTCDate(start.getUTCDate() + starter.day);
  return {
    starts_at: start.toISOString().slice(0, 16),
    ends_at: new Date(start.getTime() + starter.duration * 60000)
      .toISOString()
      .slice(0, 16),
  };
}

const venueZones: [RegExp, string, string][] = [
  [
    /\b(calgary|banff|canmore|edmonton|jasper)\b/i,
    "America/Edmonton",
    "Alberta",
  ],
  [
    /\b(vancouver|whistler|victoria)\b/i,
    "America/Vancouver",
    "British Columbia",
  ],
  [/\b(toronto|ottawa|montreal)\b/i, "America/Toronto", "Eastern Canada"],
  [/\b(new york|miami)\b/i, "America/New_York", "US Eastern time"],
  [
    /\b(los angeles|san francisco|san diego)\b/i,
    "America/Los_Angeles",
    "US Pacific time",
  ],
  [
    /\b(lake como|rome|florence|tuscany|italy|amalfi|venice)\b/i,
    "Europe/Rome",
    "Italy",
  ],
  [/\b(paris|provence|france)\b/i, "Europe/Paris", "France"],
  [/\b(london|united kingdom)\b/i, "Europe/London", "United Kingdom"],
  [/\b(santorini|athens|greece)\b/i, "Europe/Athens", "Greece"],
];
export function venueTimezone(location: string) {
  const matches = venueZones.filter(([pattern]) => pattern.test(location));
  const zones = new Set(matches.map(([, zone]) => zone));
  return zones.size === 1
    ? { zone: matches[0][1], label: matches[0][2] }
    : null;
}

export function eventConflicts(
  start: string,
  end: string,
  zone: string,
  events: { id: string; title: string; starts_at: string; ends_at: string }[],
  id?: string,
) {
  if (!start || !end || !zone) return [];
  try {
    const begins = Date.parse(eventInstant(start, zone));
    const ends = Date.parse(eventInstant(end, zone));
    if (ends <= begins)
      return [
        "The end must be after the start. Check the date for gatherings that run past midnight.",
      ];
    return events
      .filter(
        (e) =>
          e.id !== id &&
          begins < Date.parse(e.ends_at) &&
          ends > Date.parse(e.starts_at),
      )
      .map(
        (e) =>
          `Overlaps with ${e.title}. Check whether the same guests need to attend both.`,
      );
  } catch (error) {
    return [(error as Error).message];
  }
}

export const importFields = [
  "name",
  "first name",
  "last name",
  "email",
  "phone",
  "household",
  "tags",
];
const aliases: Record<string, string[]> = {
  name: [
    "name",
    "full name",
    "guest name",
    "guest full name",
    "nombre completo",
  ],
  "first name": ["first", "first name", "firstname", "given name", "nombre"],
  "last name": [
    "last",
    "last name",
    "surname",
    "lastname",
    "family name",
    "apellido",
  ],
  email: [
    "email",
    "email address",
    "e mail",
    "e mail address",
    "correo",
    "correo electronico",
  ],
  phone: [
    "phone",
    "phone number",
    "phone #",
    "mobile",
    "mobile number",
    "telephone",
    "telefono",
  ],
  household: [
    "household",
    "household name",
    "family",
    "group",
    "group name",
    "guest of",
    "invitation group",
    "familia",
  ],
  tags: ["tags", "relationship", "category", "guest category"],
};
export function guessColumns(headers: string[]) {
  const normalize = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  return Object.fromEntries(
    importFields.map((field) => [
      field,
      headers.find((header) => aliases[field].includes(normalize(header))) ||
        "",
    ]),
  );
}
export function importProblems(row: { name: string; email: string }) {
  return [
    !row.name.trim()
      ? "Add a guest name or map the first/last name columns."
      : "",
    row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
      ? "Check the email address, or leave it blank if you do not have one."
      : "",
  ].filter(Boolean);
}
