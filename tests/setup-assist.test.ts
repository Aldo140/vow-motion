import { describe, expect, it } from "vitest";
import { suggestedDeadline } from "../src/lib/setup-assist";

describe("RSVP deadline suggestions", () => {
  it("crosses year and leap-day boundaries using calendar dates", () => {
    expect(suggestedDeadline("2028-04-11", 6)).toBe("2028-02-29");
    expect(suggestedDeadline("2027-01-10", 4)).toBe("2026-12-13");
    expect(suggestedDeadline("")).toBe("");
  });
});
