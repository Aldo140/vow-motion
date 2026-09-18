import { isPlaceholderGuestName } from "./momentum";
import type { Guest } from "./types";

/**
 * The decorative envelope/hero copy shows first names in a couple's own
 * words. An unconfirmed plus-one's row is still a couple-entered placeholder
 * like "Plus-one" — showing that literally ("A place here, just for Jessica &
 * Plus-one.") reads as broken copy, so it falls back to a plain word instead.
 */
export function guestDisplayFirstName(guest: Guest, locale: "en" | "es") {
  if (guest.is_plus_one && isPlaceholderGuestName(guest.name))
    return locale === "en" ? "your guest" : "tu invitado";
  return guest.name.split(" ")[0];
}

export function guestFirstNamesLine(guests: Guest[], locale: "en" | "es") {
  return guests.map((guest) => guestDisplayFirstName(guest, locale)).join(" & ");
}
