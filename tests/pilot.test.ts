import { describe, it, expect } from "vitest";
import {
  identitySchema,
  identityStyle,
  weddingIdentity,
} from "../src/lib/identity";
import { planningActions, setupSteps } from "../src/lib/pilot";
import type { StudioData } from "../src/lib/types";

describe("planner pilot", () => {
  it("accepts curated identities and rejects arbitrary styles", () => {
    expect(
      identitySchema.safeParse({ accent: "red; background:url(example)" })
        .success,
    ).toBe(false);
    expect(identitySchema.safeParse({ imagePosition: 101 }).success).toBe(
      false,
    );
    expect(identitySchema.safeParse({ typography: "unknown" }).success).toBe(
      false,
    );
    expect(weddingIdentity({}).imagePosition).toBe(50);
    expect(identityStyle({ identity: { accent: "wine" } }, true)).not.toEqual(
      identityStyle({ identity: { accent: "wine" } }, false),
    );
  });
  it("counts household work once and respects shared travel answers", () => {
    const data = {
      wedding: { settings: {} },
      households: [{ id: "h", name: "Family" }],
      guests: [
        { id: "a", household_id: "h", status: "pending" },
        { id: "b", household_id: "h", status: "pending" },
      ],
      questions: [
        {
          id: "travel",
          label: "Hotel name",
          scope: "household",
          required: true,
        },
      ],
      responses: [
        {
          guest_id: "a",
          event_id: "e",
          attending: true,
          meal: "Fish",
          answers: { travel: "The Inn" },
        },
        {
          guest_id: "b",
          event_id: "e",
          attending: true,
          meal: "",
          answers: {},
        },
      ],
      guestRequests: [{ answer: "" }, { answer: "Answered" }],
    } as unknown as StudioData;
    expect(planningActions(data).awaiting).toHaveLength(1);
    expect(planningActions(data).meals).toHaveLength(1);
    expect(planningActions(data).missingTravel).toHaveLength(0);
    expect(planningActions(data).unanswered).toHaveLength(1);
    data.responses![0].answers = {};
    expect(planningActions(data).missingTravel).toEqual(["h"]);
  });
  it("does not treat seeded defaults or empty guest lists as reviewed", () => {
    const data = {
      wedding: { settings: {} },
      guests: [],
      households: [],
      events: [],
    } as unknown as StudioData;
    expect(setupSteps(data).every((s) => !s.done)).toBe(true);
    data.wedding.settings.setup = {
      identity: true,
      details: true,
      events: true,
      guests: true,
      preview: true,
    };
    expect(setupSteps(data).filter((s) => s.done)).toHaveLength(2);
  });
});
