// Who a message can actually reach, and — just as importantly — the reason it
// cannot reach the rest. The Studio and the send endpoint read the same answer
// from here, so the number a couple is shown before sending is the number the
// provider is handed afterwards.

type Recipient = {
  consent?: unknown;
  email?: unknown;
  phone?: unknown;
  status?: unknown;
  tags?: unknown;
};

/** The two things a guest can be missing before email or SMS can reach them. */
export type MessageBlocker = "opt-in" | "contact";

export const CHANNELS = ["invitation", "email", "sms"] as const;
export type Channel = (typeof CHANNELS)[number];

/** What the guest has to have supplied for this channel to carry anything. */
export const contactField = (channel: string) =>
  channel === "sms" ? "phone" : "email";

export function messagingAudience<T extends Recipient>(
  guests: T[],
  audience: string,
  channel: string,
) {
  const selected = guests.filter(
    (g) =>
      audience === "everyone" ||
      g.status === audience ||
      String(g.tags || "")
        .split(",")
        .map((t) => t.trim())
        .includes(audience),
  );
  const hasContact = (g: T) =>
    Boolean(String(channel === "email" ? g.email || "" : g.phone || "").trim());
  // An update posted inside the invitation asks nothing of the guest: it waits
  // on their own private page. Email and SMS leave the site, so both permission
  // and a way to reach them are required.
  const blockers = (g: T): MessageBlocker[] =>
    channel === "invitation"
      ? []
      : [
          ...(g.consent === true ? [] : (["opt-in"] as MessageBlocker[])),
          ...(hasContact(g) ? [] : (["contact"] as MessageBlocker[])),
        ];
  const blocked = selected
    .map((guest) => ({ guest, reasons: blockers(guest) }))
    .filter((entry) => entry.reasons.length);
  const only = (reason: MessageBlocker) =>
    blocked.filter((b) => b.reasons.length === 1 && b.reasons[0] === reason)
      .length;
  return {
    selected,
    recipients: selected.filter((g) => !blockers(g).length),
    blocked,
    // Overlapping totals, kept for anything that wants the raw figure.
    missingContact: selected.filter((g) => !hasContact(g)).length,
    notOptedIn: selected.filter((g) => g.consent !== true).length,
    // Exclusive buckets. These three add up to selected − recipients exactly,
    // so a couple can be shown a breakdown that accounts for every guest
    // instead of three numbers with a note saying they may overlap.
    awaitingOptIn: only("opt-in"),
    awaitingContact: only("contact"),
    awaitingBoth: blocked.filter((b) => b.reasons.length === 2).length,
  };
}
