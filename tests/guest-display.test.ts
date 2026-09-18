import { describe, expect, it } from "vitest";
import { guestDisplayFirstName, guestFirstNamesLine } from "../src/lib/guest-display";
import type { Guest } from "../src/lib/types";

const guest = (overrides: Partial<Guest>): Guest =>
  ({
    id: "g",
    household_id: "h",
    name: "Jessica Williams",
    email: "",
    phone: "",
    is_plus_one: false,
    is_child: false,
    consent: false,
    status: "pending",
    meal: "",
    dietary: "",
    tags: "",
    ...overrides,
  }) as Guest;

describe("guestDisplayFirstName", () => {
  it("uses the guest's first name normally", () => {
    expect(guestDisplayFirstName(guest({}), "en")).toBe("Jessica");
  });

  it("does not leak a couple-entered plus-one placeholder into decorative copy", () => {
    const placeholder = guest({ name: "Plus-one", is_plus_one: true });
    expect(guestDisplayFirstName(placeholder, "en")).toBe("your guest");
    expect(guestDisplayFirstName(placeholder, "es")).toBe("tu invitado");
  });

  it("shows a plus-one's real first name once they have renamed themselves", () => {
    const named = guest({ name: "Alex Rivera", is_plus_one: true });
    expect(guestDisplayFirstName(named, "en")).toBe("Alex");
  });
});

describe("guestFirstNamesLine", () => {
  it("joins first names with an ampersand", () => {
    const guests = [guest({ name: "Jessica Williams" }), guest({ name: "Daniel Williams" })];
    expect(guestFirstNamesLine(guests, "en")).toBe("Jessica & Daniel");
  });

  it("substitutes an unnamed plus-one so the line never reads as broken", () => {
    const guests = [
      guest({ name: "Jessica Williams" }),
      guest({ name: "Guest", is_plus_one: true }),
    ];
    expect(guestFirstNamesLine(guests, "en")).toBe("Jessica & your guest");
  });
});
