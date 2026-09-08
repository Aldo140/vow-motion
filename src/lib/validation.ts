import { z } from "zod";
export const safeUrl = z
  .string()
  .max(2000)
  .refine((v) => !v || /^https:\/\//i.test(v), "Use an https:// link.");
export const worldSchema = z.enum([
  "riviera",
  "maison",
  "notte",
  "heritage",
  "modernist",
  "garden",
]);
export const guestSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.union([z.email(), z.literal("")]).default(""),
  phone: z.string().max(50).default(""),
  address: z.string().max(500).default(""),
  household_id: z.string().optional(),
  household: z.string().max(150).optional(),
  language: z.enum(["en", "es"]).default("en"),
  tags: z.string().max(300).default(""),
  notes: z.string().max(1000).default(""),
  is_plus_one: z.boolean().default(false),
  consent: z.boolean().default(false),
});
export const eventSchema = z
  .object({
    title: z.string().trim().min(1).max(150),
    title_es: z.string().max(150).default(""),
    starts_at: z.iso.datetime({ offset: true }),
    ends_at: z.iso.datetime({ offset: true }),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid IANA timezone."),
    venue: z.string().min(1).max(200),
    address: z.string().max(500).default(""),
    description: z.string().max(3000).default(""),
    dress_code: z.string().max(300).default(""),
    visibility: z.enum(["all", "private"]).default("all"),
    capacity: z.number().int().min(1).max(10000).default(200),
    rsvp_required: z.boolean().default(true),
    household_ids: z.array(z.string()).default([]),
  })
  .refine(
    (v) => new Date(v.ends_at) > new Date(v.starts_at),
    "The event must end after it starts.",
  );
export const schemas = {
  travel: z.object({
    title: z.string().min(1).max(200),
    type: z.enum(["hotel", "transport", "guide"]).default("hotel"),
    description: z.string().min(1).max(4000),
    address: z.string().max(500).default(""),
    url: safeUrl.default(""),
    price: z.string().max(100).default(""),
  }),
  faqs: z.object({
    question: z.string().min(1).max(300),
    question_es: z.string().max(300).default(""),
    answer: z.string().min(1).max(4000),
    answer_es: z.string().max(4000).default(""),
    position: z.number().int().min(0).max(999).default(0),
  }),
  registry: z.object({
    title: z.string().min(1).max(100),
    url: safeUrl.refine((v) => !!v),
  }),
  questions: z.object({
    label: z.string().min(1).max(300),
    label_es: z.string().max(300).default(""),
    type: z.enum(["text", "select", "yes-no", "number"]).default("text"),
    scope: z.enum(["household", "person"]).default("household"),
    condition: z.enum(["attending", "always"]).default("attending"),
    options: z.array(z.string().max(150)).max(20).default([]),
    required: z.boolean().default(false),
  }),
  tables: z.object({
    name: z.string().min(1).max(100),
    capacity: z.number().int().min(1).max(30),
  }),
  collaborators: z.object({
    email: z.email(),
    role: z.enum(["partner", "planner", "viewer"]),
  }),
  domains: z.object({
    hostname: z
      .string()
      .toLowerCase()
      .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),
  }),
};
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function escapeIcs(v: string) {
  return v
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}
