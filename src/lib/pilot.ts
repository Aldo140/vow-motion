import type { StudioData } from "./types";

export function setupSteps(data: StudioData) {
  const setup = (data.wedding.settings.setup ?? {}) as Record<string, unknown>;
  return [
    {
      id: "identity",
      title: "Choose your world",
      section: "experience",
      done: setup.identity === true,
    },
    {
      id: "details",
      title: "Confirm the couple’s details",
      section: "settings",
      done: setup.details === true,
    },
    {
      id: "events",
      title: "Review events and private invitations",
      section: "events",
      done: data.events.length > 0 && setup.events === true,
    },
    {
      id: "guests",
      title: "Bring in the guest list",
      section: "guests",
      done: data.guests.length > 0 && setup.guests === true,
    },
    {
      id: "preview",
      title: "Review a household’s invitation",
      section: "",
      done: data.households.length > 0 && setup.preview === true,
    },
  ];
}
export function planningActions(data: StudioData) {
  const responses = data.responses ?? [];
  const awaiting = data.households.filter((h) =>
    data.guests.some((g) => g.household_id === h.id && g.status === "pending"),
  );
  const meals = responses.filter((r) => r.attending && !r.meal.trim());
  const travelQuestions = data.questions.filter(
    (q) =>
      /travel|arrival|flight|hotel|accommodation|shuttle|transport/i.test(
        q.label,
      ) && q.required,
  );
  const missingTravel = new Set<string>();
  for (const r of responses) {
    if (!r.attending) continue;
    for (const q of travelQuestions) {
      const g = data.guests.find((g) => g.id === r.guest_id);
      const answered =
        q.scope === "household"
          ? responses.some(
              (other) =>
                data.guests.find((x) => x.id === other.guest_id)
                  ?.household_id === g?.household_id &&
                other.answers[q.id]?.trim(),
            )
          : !!r.answers[q.id]?.trim();
      if (!answered && g) missingTravel.add(g.household_id);
    }
  }
  return {
    awaiting,
    meals,
    missingTravel: [...missingTravel],
    unanswered: (data.guestRequests ?? []).filter((q) => !q.answer.trim()),
  };
}
