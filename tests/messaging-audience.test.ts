import { describe, expect, it } from "vitest";
import { messagingAudience } from "../src/lib/messaging-audience";
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
});
