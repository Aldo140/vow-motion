import { describe, expect, it } from "vitest";
import { preSendChecklist } from "../src/lib/pre-send-checklist";
import type { StudioData } from "../src/lib/types";

const fresh = () =>
  ({
    wedding: {
      id: "w",
      names: "A & B",
      date: "2027-06-20",
      rsvp_deadline: "2027-05-20",
      timezone: "America/Edmonton",
      settings: {},
      status: "draft",
    },
    households: [
      { id: "h1", name: "The Smiths" },
      { id: "h2", name: "The Jones" },
    ],
    guests: [],
    events: [],
  }) as unknown as StudioData;

describe("preSendChecklist", () => {
  it("warns when no events exist yet", () => {
    const warnings = preSendChecklist(fresh(), []);
    expect(warnings.map((w) => w.id)).toContain("no-events");
  });

  it("warns about events missing a date", () => {
    const data = fresh();
    data.events = [{ id: "e1", title: "Ceremony", starts_at: "" } as never];
    const warnings = preSendChecklist(data, []);
    expect(warnings.map((w) => w.id)).toContain("undated-events");
  });

  it("warns when the RSVP deadline is after the wedding date", () => {
    const data = fresh();
    data.wedding.rsvp_deadline = "2027-07-01";
    data.events = [{ id: "e1", title: "Ceremony", starts_at: "2027-06-20T18:00:00Z" } as never];
    const warnings = preSendChecklist(data, []);
    expect(warnings.map((w) => w.id)).toContain("deadline-after-wedding");
  });

  it("warns when a private event has no households invited", () => {
    const data = fresh();
    data.events = [
      {
        id: "e1",
        title: "Rehearsal dinner",
        starts_at: "2027-06-19T18:00:00Z",
        visibility: "private",
        household_ids: [],
      } as never,
    ];
    const warnings = preSendChecklist(data, []);
    expect(warnings.map((w) => w.id)).toContain("empty-private-events");
  });

  it("warns when a chosen household is not invited to any event", () => {
    const data = fresh();
    data.events = [
      {
        id: "e1",
        title: "Reception",
        starts_at: "2027-06-20T18:00:00Z",
        visibility: "private",
        household_ids: ["h1"],
      } as never,
    ];
    const warnings = preSendChecklist(data, ["h1", "h2"]);
    const stranded = warnings.find((w) => w.id === "stranded-households");
    expect(stranded?.text).toContain("The Jones");
    expect(stranded?.text).not.toContain("The Smiths");
  });

  it("does not warn when an open event covers every household", () => {
    const data = fresh();
    data.events = [
      {
        id: "e1",
        title: "Reception",
        starts_at: "2027-06-20T18:00:00Z",
        visibility: "all",
      } as never,
    ];
    const warnings = preSendChecklist(data, ["h1", "h2"]);
    expect(warnings.map((w) => w.id)).not.toContain("stranded-households");
  });

  it("warns about event timezones that differ from the wedding", () => {
    const data = fresh();
    data.events = [
      {
        id: "e1",
        title: "Reception",
        starts_at: "2027-06-20T18:00:00Z",
        timezone: "Europe/Paris",
        visibility: "all",
      } as never,
    ];
    const warnings = preSendChecklist(data, []);
    expect(warnings.map((w) => w.id)).toContain("timezone-mismatch");
  });

  it("stays quiet when everything checks out", () => {
    const data = fresh();
    data.wedding.rsvp_deadline = "2027-05-20";
    data.events = [
      {
        id: "e1",
        title: "Reception",
        starts_at: "2027-06-20T18:00:00Z",
        timezone: "America/Edmonton",
        visibility: "all",
      } as never,
    ];
    const warnings = preSendChecklist(data, ["h1", "h2"]);
    expect(warnings).toEqual([]);
  });
});
