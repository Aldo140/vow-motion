import { describe, expect, it } from "vitest";
import {
  matchesGuestFilter,
  readinessSignature,
  weddingHealth,
  weddingMomentum,
} from "../src/lib/momentum";
import { telemetrySchema } from "../src/lib/momentum-telemetry";
import { messagingAudience } from "../src/lib/messaging-audience";
import type { StudioData, Guest } from "../src/lib/types";

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
    households: [],
    guests: [],
    events: [],
    questions: [],
    responses: [],
    tables: [],
    travel: [],
    photos: [],
    invitationDispatches: [],
    invitedHouseholds: [],
    guestRequests: [],
    messages: [],
    role: "owner",
    user: { is_demo: false },
    capabilities: { email: false },
  }) as unknown as StudioData;
const guest = (id: string, household = "h") =>
  ({
    id,
    household_id: household,
    name: id,
    email: "",
    phone: "",
    status: "pending",
    meal: "",
    dietary: "",
    is_plus_one: false,
    consent: false,
    tags: "",
  }) as Guest;
const now = new Date("2027-05-22T12:00:00Z");
describe("wedding momentum", () => {
  it("preparing a private link alone does not complete the invitation chapter", () => {
    const d = fresh();
    d.households = [{ id: "h", name: "h" }];
    d.guests = [guest("a")];
    d.invitedHouseholds = ["h"];
    expect(
      weddingMomentum(d, now).chapters.find((c) => c.id === "invite")?.complete,
    ).toBe(false);
  });
  it("does not manufacture completed chapters for an empty wedding", () => {
    const m = weddingMomentum(fresh(), now);
    expect(m.completedChapters).toBe(0);
    expect(m.primaryAction?.id).toBe("add-guests");
  });
  it("resolves contacts at household scope and filters all members", () => {
    const d = fresh();
    d.households = [
      { id: "h", name: "h" },
      { id: "j", name: "j" },
    ];
    d.guests = [guest("a"), guest("b"), guest("c", "j")];
    d.guests[1].email = "b@example.com";
    const h = weddingHealth(d);
    expect(h.missingEmail.map((x) => x.id)).toEqual(["j"]);
    expect(matchesGuestFilter(d.guests[0], "missing-email", h)).toBe(false);
    expect(matchesGuestFilter(d.guests[2], "missing-email", h)).toBe(true);
  });
  it("prioritizes overdue invited replies over setup and ready invitations", () => {
    const d = fresh();
    d.households = [
      { id: "h", name: "h" },
      { id: "j", name: "j" },
    ];
    d.guests = [guest("a"), guest("b", "j")];
    d.guests.forEach((g) => (g.email = "a@example.com"));
    d.invitedHouseholds = ["h"];
    const m = weddingMomentum(d, now);
    expect(m.primaryAction?.id).toBe("awaiting-replies");
    expect(m.health.awaiting).toHaveLength(1);
    expect(m.primaryAction?.destination.intent).toBe("rsvp-reminder");
  });
  it("does not treat uninvited pending guests as overdue", () => {
    const d = fresh();
    d.households = [{ id: "h", name: "h" }];
    d.guests = [guest("a")];
    expect(weddingMomentum(d, now).primaryAction?.id).toBe("fix-contacts");
    expect(weddingHealth(d).awaiting).toHaveLength(0);
  });
  it("uses the venue date for reply deadline boundaries", () => {
    const d = fresh();
    d.wedding.rsvp_deadline = "2027-05-20";
    d.households = [{ id: "h", name: "h" }];
    d.guests = [{ ...guest("a"), email: "a@example.com" }];
    d.invitedHouseholds = ["h"];
    const m = weddingMomentum(d, new Date("2027-05-21T02:00:00Z"));
    expect(m.actions.find((a) => a.id === "awaiting-replies")?.priority).toBe(
      57,
    );
  });
  it("shares household answers and never flags an optional blank dietary note", () => {
    const d = fresh();
    d.guests = [
      { ...guest("a"), status: "attending", meal: "Fish" },
      { ...guest("b"), status: "attending", meal: "Fish" },
    ];
    d.households = [{ id: "h", name: "h" }];
    d.questions = [
      {
        id: "q",
        label: "Shuttle",
        scope: "household",
        required: true,
        condition: "attending",
        options: [],
        label_es: "",
        type: "select",
      },
    ];
    d.responses = [
      {
        guest_id: "a",
        event_id: "e",
        attending: true,
        meal: "Fish",
        answers: { q: "No" },
      },
    ];
    expect(weddingHealth(d).missingAnswers).toHaveLength(0);
    expect(weddingHealth(d).missingMeals).toHaveLength(0);
    d.responses[0].answers = {};
    expect(weddingHealth(d).missingAnswers).toHaveLength(2);
  });
  it("keeps failed, suppressed and demo dispatches distinct from real sends", () => {
    const d = fresh();
    d.households = [{ id: "h", name: "h" }];
    d.guests = [{ ...guest("a"), email: "a@example.com" }];
    d.invitationDispatches = [
      {
        id: "x",
        household_id: "h",
        email: "a@example.com",
        status: "suppressed",
        created_at: "2027-01-01",
      },
    ];
    expect(weddingHealth(d).sent.size).toBe(0);
    expect(weddingHealth(d).ready).toHaveLength(0);
    expect(weddingMomentum(d, now).primaryAction?.id).toBe("delivery-issues");
    d.invitationDispatches[0].status = "development";
    expect(weddingHealth(d).sent.size).toBe(0);
    d.user.is_demo = true;
    expect(weddingHealth(d).sent.size).toBe(1);
  });
  it("moves the focus to memories after the venue's wedding day", () => {
    const d = fresh();
    expect(
      weddingMomentum(d, new Date("2027-06-22T12:00:00Z")).currentChapter.id,
    ).toBe("memories");
  });
  it("invalidates a final review when operational facts change", () => {
    const d = fresh();
    const before = readinessSignature(d);
    d.travel.push({
      id: "t",
      title: "Hotel",
      type: "hotel",
      description: "New location",
      url: "",
      address: "",
      price: "",
    });
    expect(readinessSignature(d)).not.toBe(before);
  });
  it("accepts only content-free telemetry", () => {
    expect(
      telemetrySchema.safeParse({ event: "screen_viewed", screen: "guests" })
        .success,
    ).toBe(true);
    for (const payload of [
      { event: "screen_viewed", screen: "someone@example.com" },
      { event: "screen_viewed", screen: "guests", email: "x@example.com" },
      { event: "recommended_action_selected", action: "Guest Smith" },
      { event: "first_household", elapsed_ms: -1 },
    ])
      expect(telemetrySchema.safeParse(payload).success).toBe(false);
  });
  it("reminder intent preserves both invitation eligibility and consent", () => {
    const guests = [
      { ...guest("a"), invited: true, email: "a@example.com", consent: true },
      { ...guest("b"), invited: false, email: "b@example.com", consent: true },
      { ...guest("c"), invited: true, email: "c@example.com", consent: false },
    ];
    const result = messagingAudience(guests, "invited-pending", "email");
    expect(result.selected).toHaveLength(2);
    expect(result.recipients.map((g) => g.id)).toEqual(["a"]);
  });
});
