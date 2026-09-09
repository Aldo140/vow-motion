import { describe, expect, it } from "vitest";
import { messagingAudience } from "../src/lib/messaging-audience";
import { canRetry, despatchState } from "../src/lib/message-state";
import { weddingUpdatesSchema } from "../src/lib/validation";
describe("wedding update permission", () => {
  const guests = [
    {
      id: "yes",
      consent: true,
      email: "yes@example.com",
      phone: "",
      status: "attending",
      tags: "family",
    },
    {
      id: "no",
      consent: false,
      email: "no@example.com",
      phone: "",
      status: "attending",
      tags: "family",
    },
    {
      id: "missing",
      consent: true,
      email: " ",
      phone: "+14035550100",
      status: "declined",
      tags: "",
    },
  ];
  it("does not treat attendance as permission and respects channel and audience", () => {
    expect(
      messagingAudience(guests, "attending", "email").recipients.map(
        (g) => g.id,
      ),
    ).toEqual(["yes"]);
    expect(
      messagingAudience(guests, "everyone", "sms").recipients.map((g) => g.id),
    ).toEqual(["missing"]);
    expect(
      messagingAudience(guests, "family", "invitation").recipients,
    ).toHaveLength(2);
    expect(messagingAudience(guests, "everyone", "email").missingContact).toBe(
      1,
    );
  });
  it("allows RSVP without opt in, but requires contact details when opting in", () => {
    const contact = { guest_id: "one", email: "", phone: "", consent: false };
    expect(weddingUpdatesSchema.safeParse(contact).success).toBe(true);
    expect(
      weddingUpdatesSchema.safeParse({ ...contact, consent: true }).success,
    ).toBe(false);
    expect(
      weddingUpdatesSchema.safeParse({
        ...contact,
        consent: true,
        email: "guest@example.com",
      }).success,
    ).toBe(true);
  });

  // The Studio shows a couple why a message cannot reach everyone. Three
  // overlapping totals could not be added up, so the reasons are now exclusive
  // and must account for every guest who is out of reach — no more, no fewer.
  it("explains every guest out of reach exactly once", () => {
    const roster = [
      // Reachable.
      { id: "a", consent: true, email: "a@example.com", phone: "", status: "" },
      // Has an address, has not agreed to be written to.
      {
        id: "b",
        consent: false,
        email: "b@example.com",
        phone: "",
        status: "",
      },
      // Agreed, but left nothing to write to.
      { id: "c", consent: true, email: "", phone: "", status: "" },
      // Neither.
      { id: "d", consent: false, email: "", phone: "", status: "" },
    ];
    const reach = messagingAudience(roster, "everyone", "email");
    expect(reach.recipients.map((g) => g.id)).toEqual(["a"]);
    expect(reach.awaitingOptIn).toBe(1);
    expect(reach.awaitingContact).toBe(1);
    expect(reach.awaitingBoth).toBe(1);
    expect(
      reach.awaitingOptIn + reach.awaitingContact + reach.awaitingBoth,
    ).toBe(reach.selected.length - reach.recipients.length);
    // An invitation update asks nothing of a guest, so nobody is out of reach.
    const inside = messagingAudience(roster, "everyone", "invitation");
    expect(inside.recipients).toHaveLength(4);
    expect(inside.blocked).toHaveLength(0);
    expect(
      inside.awaitingOptIn + inside.awaitingContact + inside.awaitingBoth,
    ).toBe(0);
  });
});

describe("how a message reads on the shelf", () => {
  const now = Date.parse("2026-06-01T12:00:00Z");
  const base = {
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    scheduled_at: null as string | null,
  };
  it("never dresses a failure as a success", () => {
    expect(despatchState({ ...base, status: "sent" }, now).tone).toBe("done");
    expect(despatchState({ ...base, status: "failed" }, now)).toEqual({
      label: "Nothing sent",
      tone: "trouble",
    });
    expect(
      despatchState({ ...base, status: "partially-failed" }, now).tone,
    ).toBe("trouble");
  });
  it("separates a send in flight from one that stopped", () => {
    const justNow = new Date(now - 30_000).toISOString();
    expect(
      despatchState({ ...base, updated_at: justNow, status: "processing" }, now)
        .label,
    ).toBe("Sending now");
    expect(despatchState({ ...base, status: "processing" }, now).label).toBe(
      "Stopped part-way",
    );
  });
  it("marks a published update still waiting for its time as scheduled", () => {
    const future = new Date(now + 86_400_000).toISOString();
    expect(
      despatchState({ ...base, scheduled_at: future, status: "published" }, now)
        .label,
    ).toBe("Scheduled");
    expect(despatchState({ ...base, status: "published" }, now).label).toBe(
      "Published",
    );
  });
  it("offers a way back from anything that did not finish", () => {
    expect(canRetry({ ...base, status: "failed" }, now)).toBe(true);
    expect(canRetry({ ...base, status: "partially-failed" }, now)).toBe(true);
    expect(canRetry({ ...base, status: "processing" }, now)).toBe(true);
    expect(canRetry({ ...base, status: "sent" }, now)).toBe(false);
    expect(canRetry({ ...base, status: "draft" }, now)).toBe(false);
  });
});
