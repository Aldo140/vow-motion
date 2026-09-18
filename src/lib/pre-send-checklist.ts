import type { StudioData } from "./types";

export type ChecklistWarning = {
  id: string;
  text: string;
  href: string;
  cta: string;
};

/**
 * Catches send-time mistakes that "ready to send" does not, by reading the
 * households actually chosen for this campaign against the event/deadline
 * data those households would receive. Pure and read-only: never blocks a
 * send, only warns before the couple commits to it.
 */
export function preSendChecklist(
  data: StudioData,
  householdIds: string[],
): ChecklistWarning[] {
  const warnings: ChecklistWarning[] = [];
  const weddingId = data.wedding.id;

  if (!data.events.length) {
    warnings.push({
      id: "no-events",
      text: "No events are on the schedule yet. Guests will open an invitation with nothing to RSVP to.",
      href: `/studio/events?wid=${weddingId}`,
      cta: "Add an event",
    });
  }

  const undated = data.events.filter((e) => !e.starts_at);
  if (undated.length)
    warnings.push({
      id: "undated-events",
      text: `${undated.length} ${undated.length === 1 ? "event has" : "events have"} no date or time set: ${undated
        .map((e) => e.title || "Untitled event")
        .join(", ")}.`,
      href: `/studio/events?wid=${weddingId}`,
      cta: "Set the date",
    });

  if (data.wedding.rsvp_deadline && data.wedding.date) {
    const deadline = new Date(data.wedding.rsvp_deadline);
    const weddingDate = new Date(data.wedding.date);
    if (!Number.isNaN(deadline.getTime()) && !Number.isNaN(weddingDate.getTime())) {
      if (deadline.getTime() > weddingDate.getTime())
        warnings.push({
          id: "deadline-after-wedding",
          text: "The RSVP deadline is set after the wedding date.",
          href: `/studio/settings?wid=${weddingId}`,
          cta: "Fix the deadline",
        });
      else if (deadline.getTime() < Date.now())
        warnings.push({
          id: "deadline-passed",
          text: "The RSVP deadline has already passed. Guests opening their invitation may see a closed reply form.",
          href: `/studio/settings?wid=${weddingId}`,
          cta: "Move the deadline",
        });
    }
  }

  const privateEvents = data.events.filter((e) => e.visibility === "private");
  const emptyPrivate = privateEvents.filter(
    (e) => !e.household_ids?.length,
  );
  if (emptyPrivate.length)
    warnings.push({
      id: "empty-private-events",
      text: `${emptyPrivate.length} private ${emptyPrivate.length === 1 ? "event has" : "events have"} no households invited yet: ${emptyPrivate
        .map((e) => e.title || "Untitled event")
        .join(", ")}.`,
      href: `/studio/events?wid=${weddingId}`,
      cta: "Invite households",
    });

  const hasOpenEvent = data.events.some((e) => e.visibility === "all");
  if (!hasOpenEvent && privateEvents.length) {
    const visible = (householdId: string) =>
      privateEvents.some((e) => e.household_ids?.includes(householdId));
    const strandedIds = householdIds.filter((id) => !visible(id));
    if (strandedIds.length) {
      const names = data.households
        .filter((h) => strandedIds.includes(h.id))
        .map((h) => h.name);
      warnings.push({
        id: "stranded-households",
        text: `${strandedIds.length} ${strandedIds.length === 1 ? "household in this send is" : "households in this send are"} not invited to any event: ${names.join(", ")}.`,
        href: `/studio/events?wid=${weddingId}`,
        cta: "Review event invitations",
      });
    }
  }

  const timezoneMismatch = data.events.filter(
    (e) => e.timezone && e.timezone !== data.wedding.timezone,
  );
  if (timezoneMismatch.length)
    warnings.push({
      id: "timezone-mismatch",
      text: `${timezoneMismatch.length} ${timezoneMismatch.length === 1 ? "event uses" : "events use"} a different timezone than the wedding: ${timezoneMismatch
        .map((e) => e.title || "Untitled event")
        .join(", ")}. Double-check the times guests will see.`,
      href: `/studio/events?wid=${weddingId}`,
      cta: "Review times",
    });

  return warnings;
}
