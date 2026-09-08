import { describe, expect, it } from "vitest";
import {
  eventConflicts,
  eventStarters,
  guessColumns,
  importProblems,
  starterTimes,
  venueTimezone,
} from "../src/lib/planning-assist";

describe("planning assistance", () => {
  it("suggests calendar-relative event drafts across year boundaries", () => {
    expect(starterTimes("2028-01-01", eventStarters[2])).toEqual({
      starts_at: "2027-12-31T18:00",
      ends_at: "2027-12-31T20:00",
    });
    expect(starterTimes("2028-02-29", eventStarters[3]).starts_at).toBe(
      "2028-03-01T10:00",
    );
  });
  it("compares overlap as instants and permits adjacent gatherings", () => {
    const events = [
      {
        id: "one",
        title: "Ceremony",
        starts_at: "2028-06-10T14:00:00Z",
        ends_at: "2028-06-10T15:00:00Z",
      },
    ];
    expect(
      eventConflicts(
        "2028-06-10T16:30",
        "2028-06-10T17:30",
        "Europe/Rome",
        events,
      )[0],
    ).toContain("Ceremony");
    expect(
      eventConflicts(
        "2028-06-10T17:00",
        "2028-06-10T18:00",
        "Europe/Rome",
        events,
      ),
    ).toEqual([]);
    expect(
      eventConflicts(
        "2028-06-10T17:00",
        "2028-06-10T16:00",
        "Europe/Rome",
        events,
      )[0],
    ).toContain("end must be after");
  });
  it("recognizes common exported headers and explains each bad field", () => {
    expect(
      guessColumns(["Guest_Full_Name", "E-mail Address", "Invitation Group"])
        .email,
    ).toBe("E-mail Address");
    expect(guessColumns(["Guest_Full_Name"]).name).toBe("Guest_Full_Name");
    expect(importProblems({ name: "", email: "bad" })).toHaveLength(2);
    expect(importProblems({ name: "Alex", email: "" })).toEqual([]);
  });
  it("avoids guessing when location text names different zones", () => {
    expect(venueTimezone("Banff, Alberta")?.zone).toBe("America/Edmonton");
    expect(venueTimezone("Between Banff and Vancouver")).toBeNull();
    expect(venueTimezone("Our family garden")).toBeNull();
  });
});
