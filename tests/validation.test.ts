import { describe, it, expect } from "vitest";
import {
  guestSchema,
  eventSchema,
  csvCell,
  escapeIcs,
} from "../src/lib/validation";
import { passwordHash, passwordMatches, hash, token } from "../src/lib/auth";
describe("guest and security boundaries", () => {
  it("accepts names with accents and rejects invalid email", () => {
    expect(guestSchema.parse({ name: "Sofía García" }).name).toBe(
      "Sofía García",
    );
    expect(guestSchema.safeParse({ name: "", email: "oops" }).success).toBe(
      false,
    );
  });
  it("requires unambiguous event times and valid timezone", () => {
    const e = {
      title: "Vows",
      starts_at: "2027-06-19T16:00:00+02:00",
      ends_at: "2027-06-19T17:00:00+02:00",
      timezone: "Europe/Rome",
      venue: "Villa",
    };
    expect(eventSchema.safeParse(e).success).toBe(true);
    expect(
      eventSchema.safeParse({ ...e, starts_at: "2027-06-19T16:00" }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ ...e, timezone: "Invalid/Place" }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ ...e, ends_at: "2027-06-18T17:00:00Z" }).success,
    ).toBe(false);
  });
  it("prevents spreadsheet formula injection and escapes CSV", () => {
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(csvCell("Hello, world")).toBe('"Hello, world"');
  });
  it("escapes iCalendar content", () =>
    expect(escapeIcs("Venue; city,\nItaly")).toBe("Venue\\; city\\,\\nItaly"));
  it("uses salted password hashing and opaque tokens", () => {
    const a = passwordHash("long-password-123"),
      b = passwordHash("long-password-123");
    expect(a).not.toBe(b);
    expect(passwordMatches("long-password-123", a)).toBe(true);
    expect(passwordMatches("wrong", a)).toBe(false);
    expect(token()).toHaveLength(43);
    expect(hash("token")).toHaveLength(64);
  });
});
