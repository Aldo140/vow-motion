import { describe, expect, it } from "vitest";
import { eventInstant, localEventTime } from "../src/lib/event-time";
describe("venue local time", () => {
  it("round trips events across timezones and midnight", () => {
    for (const zone of [
      "Europe/Rome",
      "America/New_York",
      "Asia/Kathmandu",
      "Pacific/Auckland",
      "UTC",
    ]) {
      const instant = "2027-06-19T23:30:00.000Z";
      expect(eventInstant(localEventTime(instant, zone), zone)).toBe(instant);
    }
  });
  it("does not silently move a wedding through daylight saving changes", () => {
    expect(() => eventInstant("2027-03-14T02:30", "America/New_York")).toThrow(
      "skipped",
    );
    expect(() => eventInstant("2027-11-07T01:30", "America/New_York")).toThrow(
      "twice",
    );
    expect(eventInstant("2027-11-07T03:30", "America/New_York")).toBe(
      "2027-11-07T08:30:00.000Z",
    );
  });
});
