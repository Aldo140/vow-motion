type Recipient = {
  consent?: unknown;
  email?: unknown;
  phone?: unknown;
  status?: unknown;
  tags?: unknown;
};

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
  return {
    selected,
    recipients: selected.filter(
      (g) => channel === "invitation" || (g.consent === true && hasContact(g)),
    ),
    missingContact: selected.filter((g) => !hasContact(g)).length,
    notOptedIn: selected.filter((g) => g.consent !== true).length,
  };
}
