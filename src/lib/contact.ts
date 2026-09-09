import { z } from "zod";
export const contactEmail = "jorti104@mtroyal.ca";
export const contactSchema = z.object({
  requestId: z.string().uuid(),
  role: z.enum(["couple", "planner"]),
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").max(254),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more so we can help.")
    .max(4000),
  location: z.string().trim().max(160).default(""),
  date: z.union([z.iso.date(), z.literal("")]).default(""),
  business: z.string().trim().max(160).default(""),
  website: z.string().max(0).default(""), // Honeypot; not a business website field.
});
export function contactMessage(input: z.infer<typeof contactSchema>) {
  return [
    input.role === "planner" ? "Wedding planner enquiry" : "Couple enquiry",
    `Name: ${input.name}`,
    `Reply to: ${input.email}`,
    input.role === "planner"
      ? `Business: ${input.business || "Not provided"}`
      : `Wedding date: ${input.date || "Not decided / not provided"}`,
    `Location: ${input.location || "Not provided"}`,
    "",
    input.message,
  ].join("\n");
}
