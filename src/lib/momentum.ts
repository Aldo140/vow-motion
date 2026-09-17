import type { Guest, StudioData } from "./types";
import { setupSteps } from "./pilot";
import { localEventTime } from "./event-time";

export const CHAPTER_IDS = [
  "setup",
  "people",
  "invite",
  "replies",
  "plan",
  "ready",
  "memories",
] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];
export const ACTION_IDS = [
  "review-setup",
  "add-guests",
  "fix-contacts",
  "name-plus-ones",
  "send-invitations",
  "delivery-issues",
  "awaiting-replies",
  "missing-meals",
  "missing-answers",
  "seat-guests",
  "answer-questions",
  "review-day",
  "keep-memories",
  "review-photos",
] as const;
export type ActionId = (typeof ACTION_IDS)[number];
export type Destination = { section: string; filter?: string; intent?: string };
export type MomentumAction = {
  id: ActionId;
  chapter: ChapterId;
  title: string;
  explanation: string;
  cta: string;
  destination: Destination;
  consequence: string;
  affectedCount: number;
  priority: number;
  complete: boolean;
  applicable: boolean;
  blockers: string[];
};
export const momentumHref = (weddingId: string, destination: Destination) => {
  const query = new URLSearchParams({ wid: weddingId });
  if (destination.filter) query.set("filter", destination.filter);
  if (destination.intent) query.set("intent", destination.intent);
  return `/studio/${destination.section}?${query}`;
};
export function householdContact(guests: Guest[]) {
  return (
    guests.find((g) => !g.is_plus_one && g.email.trim())?.email.trim() ||
    guests.find((g) => g.email.trim())?.email.trim() ||
    ""
  );
}

/** Counts are resolved at household/event scope, never inferred from a blank diet field. */
export function weddingHealth(data: StudioData) {
  const members = (id: string) =>
    data.guests.filter((g) => g.household_id === id);
  const households = data.households.filter((h) => members(h.id).length > 0);
  const missingEmail = households.filter(
    (h) => !members(h.id).some((g) => g.email.trim()),
  );
  const dispatches = [...data.invitationDispatches].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const latest = households
    .map((h) => dispatches.find((d) => d.household_id === h.id))
    .filter((d) => !!d);
  const sent = new Set(
    latest
      .filter((d) =>
        [
          "sent",
          "delivered",
          ...(data.user.is_demo ? ["development"] : []),
        ].includes(d.status),
      )
      .map((d) => d.household_id),
  );
  const protectedIds = new Set(
    latest
      .filter((d) =>
        [
          "queued",
          "sent",
          "delivered",
          "development",
          "complained",
          "suppressed",
        ].includes(d.status),
      )
      .map((d) => d.household_id),
  );
  const deliveryIssues = latest.filter((d) =>
    ["failed", "bounced", "complained", "suppressed"].includes(d.status),
  );
  const ready = households.filter(
    (h) =>
      !missingEmail.some((m) => m.id === h.id) &&
      !protectedIds.has(h.id) &&
      !latest.some(
        (d) =>
          d.household_id === h.id &&
          d.status === "bounced" &&
          householdContact(members(h.id)).toLowerCase() ===
            d.email.trim().toLowerCase(),
      ),
  );
  // Live links can be shared by hand. A pending record without a live link
  // or accepted dispatch is not yet a guest to chase for a reply.
  const invited = new Set([...sent, ...data.invitedHouseholds]);
  const awaiting = data.guests.filter(
    (g) => g.status === "pending" && invited.has(g.household_id),
  );
  const awaitingHouseholds = households.filter((h) =>
    awaiting.some((g) => g.household_id === h.id),
  );
  const attending = data.guests.filter((g) => g.status === "attending");
  const responses = data.responses ?? [];
  const missingMeals = attending.filter(
    (g) =>
      !g.meal.trim() ||
      responses.some(
        (r) => r.guest_id === g.id && r.attending && !r.meal.trim(),
      ),
  );
  const missingAnswers = data.guests.filter(
    (g) =>
      g.status !== "pending" &&
      data.questions.some((q) => {
        if (
          !q.required ||
          (q.condition === "attending" && g.status !== "attending")
        )
          return false;
        return !responses.some(
          (r) =>
            (q.scope === "household"
              ? members(g.household_id).some((m) => m.id === r.guest_id)
              : r.guest_id === g.id) && String(r.answers[q.id] ?? "").trim(),
        );
      }),
  );
  const unseated = attending.filter(
    (g) => !data.tables.some((t) => t.id === g.table_id),
  );
  const overCapacity = data.tables.filter(
    (t) => attending.filter((g) => g.table_id === t.id).length > t.capacity,
  );
  const unnamed = data.guests.filter(
    (g) =>
      g.is_plus_one &&
      (!g.name.trim() ||
        /^(plus[ -]?one|guest|tbd|unknown)(\s*\d*)?$/i.test(g.name.trim())),
  );
  const unanswered = (data.guestRequests ?? []).filter((q) => !q.answer.trim());
  return {
    guestCount: data.guests.length,
    households,
    missingEmail,
    sent,
    ready,
    deliveryIssues,
    invited,
    awaiting,
    awaitingHouseholds,
    attending,
    missingMeals,
    missingAnswers,
    unseated,
    overCapacity,
    unnamed,
    unanswered,
  };
}

export function matchesGuestFilter(
  guest: Guest,
  filter: string,
  health: ReturnType<typeof weddingHealth>,
) {
  if (filter === "missing-email")
    return health.missingEmail.some((h) => h.id === guest.household_id);
  if (filter === "unnamed-plus-ones")
    return health.unnamed.some((g) => g.id === guest.id);
  if (filter === "missing-meal")
    return health.missingMeals.some((g) => g.id === guest.id);
  if (filter === "missing-answers")
    return health.missingAnswers.some((g) => g.id === guest.id);
  if (filter === "awaiting")
    return health.awaiting.some((g) => g.id === guest.id);
  return filter === "all" || guest.status === filter;
}

/** A revision marker for a deliberate final review. Any operational change
 * reopens it. This is a change detector, never an authorization credential. */
export function readinessSignature(data: StudioData) {
  const facts = JSON.stringify([
    data.wedding.date,
    data.wedding.timezone,
    data.wedding.location,
    data.wedding.rsvp_deadline,
    data.guests
      .map((g) => [
        g.id,
        g.household_id,
        g.name,
        g.status,
        g.meal,
        g.dietary,
        g.table_id,
      ])
      .sort(),
    data.events
      .map((e) => [
        e.id,
        e.title,
        e.starts_at,
        e.ends_at,
        e.venue,
        e.address,
        e.visibility,
        e.household_ids,
      ])
      .sort(),
    data.tables,
    data.travel,
    data.questions,
    data.responses,
    data.guestRequests,
  ]);
  let hash = 2166136261;
  for (let i = 0; i < facts.length; i++)
    hash = Math.imul(hash ^ facts.charCodeAt(i), 16777619);
  return `v1-${(hash >>> 0).toString(16)}`;
}

export function weddingMomentum(data: StudioData, now = new Date()) {
  const h = weddingHealth(data),
    w = data.wedding;
  const today = localEventTime(now.toISOString(), w.timezone || "UTC").slice(
    0,
    10,
  );
  const afterDay = today > w.date;
  const overdue = !!w.rsvp_deadline && today > w.rsvp_deadline;
  const nearDay =
    Date.parse(w.date) - Date.parse(today) <= 14 * 86400000 && !afterDay;
  const steps = setupSteps(data),
    setupDone = steps.every((s) => s.done);
  const peopleDone =
    h.households.length > 0 && !h.missingEmail.length && !h.unnamed.length;
  const invitationDone =
    h.households.length > 0 &&
    h.households.every(
      (x) =>
        h.sent.has(x.id) ||
        data.guests.some(
          (g) => g.household_id === x.id && g.status !== "pending",
        ),
    ) &&
    !h.deliveryIssues.length;
  const repliesDone =
    invitationDone &&
    data.guests.length > 0 &&
    data.guests.every((g) => g.status !== "pending") &&
    !h.missingMeals.length &&
    !h.missingAnswers.length;
  const planDone =
    setupDone &&
    repliesDone &&
    !h.unseated.length &&
    !h.overCapacity.length &&
    !h.unanswered.length &&
    data.events.length > 0;
  const readyDone =
    planDone &&
    (w.settings.momentum as { readySignature?: string } | undefined)
      ?.readySignature === readinessSignature(data);
  const actions: MomentumAction[] = [];
  const add = (
    id: ActionId,
    chapter: ChapterId,
    title: string,
    explanation: string,
    cta: string,
    destination: Destination,
    consequence: string,
    affectedCount: number,
    priority: number,
    complete: boolean,
    applicable = true,
    blockers: string[] = [],
  ) =>
    actions.push({
      id,
      chapter,
      title,
      explanation,
      cta,
      destination,
      consequence,
      affectedCount,
      priority,
      complete,
      applicable,
      blockers,
    });
  add(
    "review-setup",
    "setup",
    "Give your invitation its finishing review.",
    `${steps.filter((s) => s.done).length} of ${steps.length} setup reviews complete. Your names, date and world are already in place.`,
    "Continue wedding setup",
    { section: "setup" },
    "A reviewed invitation, with the right events for each household.",
    steps.length - steps.filter((s) => s.done).length,
    75,
    setupDone,
    !afterDay,
  );
  add(
    "add-guests",
    "people",
    "Start with your people.",
    "One household shares one private invitation. Add a guest or bring your spreadsheet.",
    "Add your first household",
    { section: "guests" },
    "Your invitation becomes personal to the people receiving it.",
    0,
    90,
    h.households.length > 0,
    !afterDay,
  );
  add(
    "fix-contacts",
    "people",
    `${h.missingEmail.length} ${h.missingEmail.length === 1 ? "household needs" : "households need"} an email.`,
    "One reachable person per household is enough. Open only the records that need attention.",
    "Complete household contacts",
    { section: "guests", filter: "missing-email" },
    "These households can receive their private invitation by email.",
    h.missingEmail.length,
    88,
    peopleDone || !h.missingEmail.length,
    !afterDay,
  );
  add(
    "name-plus-ones",
    "people",
    `${h.unnamed.length} ${h.unnamed.length === 1 ? "plus-one needs" : "plus-ones need"} a name.`,
    "Put real names on the invitation, reply and place card.",
    "Review plus-ones",
    { section: "guests", filter: "unnamed-plus-ones" },
    "Personal invitations and accurate place cards.",
    h.unnamed.length,
    62,
    !h.unnamed.length,
    !afterDay,
  );
  add(
    "send-invitations",
    "invite",
    `${h.ready.length} ${h.ready.length === 1 ? "household invitation is" : "household invitations are"} ready.`,
    "Review the recipients, send yourself a test, then send each household its own private link.",
    "Review and send invitations",
    { section: "invitations" },
    "Your people can open their invitation and reply.",
    h.ready.length,
    82,
    invitationDone,
    !afterDay && h.ready.length > 0,
    [],
  );
  add(
    "delivery-issues",
    "invite",
    `${h.deliveryIssues.length} ${h.deliveryIssues.length === 1 ? "invitation needs" : "invitations need"} attention.`,
    "Review delivery status before retrying. Bounces need a corrected address; complaints and suppression cannot be resent.",
    "Review invitation delivery",
    { section: "invitations", filter: "delivery-issues" },
    "Resolve who still needs a reliable way to receive the invitation.",
    h.deliveryIssues.length,
    120,
    !h.deliveryIssues.length,
    !afterDay,
  );
  add(
    "awaiting-replies",
    "replies",
    `${h.awaiting.length} ${overdue ? (h.awaiting.length === 1 ? "reply is overdue" : "replies are overdue") : h.awaiting.length === 1 ? "reply still to come" : "replies still to come"}.`,
    `${h.awaitingHouseholds.length} invited households are still deciding. ${overdue ? "The reply deadline has passed." : "A considered reminder helps settle the guest count."}`,
    "Prepare a reply reminder",
    { section: "messages", intent: "rsvp-reminder" },
    "A reminder prepared for awaiting guests, with contact and consent checks intact.",
    h.awaiting.length,
    overdue ? 115 : 57,
    !h.awaiting.length,
    !afterDay,
  );
  add(
    "missing-meals",
    "replies",
    `${h.missingMeals.length} ${h.missingMeals.length === 1 ? "attending guest needs a meal choice" : "attending guests need meal choices"}.`,
    "Resolve the missing choices before the kitchen sheet is final.",
    "Review missing meals",
    { section: "rsvps", filter: "missing-meal" },
    "Your caterer receives a more complete count.",
    h.missingMeals.length,
    nearDay ? 110 : 65,
    !h.missingMeals.length,
    !afterDay,
  );
  add(
    "missing-answers",
    "replies",
    `${h.missingAnswers.length} ${h.missingAnswers.length === 1 ? "guest needs" : "guests need"} required answers.`,
    "Only required questions that apply to a guest are included. Household answers are shared.",
    "Review missing answers",
    { section: "rsvps", filter: "missing-answers" },
    "Travel and other required plans become easier to confirm.",
    h.missingAnswers.length,
    nearDay ? 108 : 64,
    !h.missingAnswers.length,
    !afterDay,
  );
  add(
    "seat-guests",
    "plan",
    h.overCapacity.length
      ? `${h.overCapacity.length} ${h.overCapacity.length === 1 ? "table is" : "tables are"} over capacity.`
      : `${h.unseated.length} ${h.unseated.length === 1 ? "attending guest needs" : "attending guests need"} a place.`,
    "Seat confirmed guests now; the plan stays open as more replies arrive.",
    "Finish the seating plan",
    { section: "seating", filter: "unseated" },
    "Table assignments appear on each guest’s private wedding pass.",
    h.unseated.length + h.overCapacity.length,
    nearDay ? 107 : 58,
    !h.unseated.length && !h.overCapacity.length,
    !afterDay && h.attending.length > 0,
  );
  add(
    "answer-questions",
    "plan",
    `${h.unanswered.length} ${h.unanswered.length === 1 ? "guest question is" : "guest questions are"} waiting.`,
    "A personal answer can clear a guest’s next decision.",
    "Answer guest questions",
    { section: "requests" },
    "Guests find your answer inside their private invitation.",
    h.unanswered.length,
    nearDay ? 109 : 68,
    !h.unanswered.length,
  );
  add(
    "review-day",
    "ready",
    "Read the day as your team will.",
    "Review the schedule, kitchen sheet, travel manifest and place cards. These are live documents; revisit them when replies change.",
    "Open your day-of documents",
    { section: "analytics" },
    "One current set of plans to review with your suppliers.",
    h.attending.length,
    nearDay ? 60 : 20,
    readyDone,
    !afterDay && planDone,
  );
  add(
    "keep-memories",
    "memories",
    "Make room for what you will remember.",
    "Your guests can share photographs through their private invitation. Review the album and choose what everyone can see.",
    "Open photos and memories",
    { section: "photos" },
    "Approved photographs become part of the shared wedding album.",
    data.photos.length,
    95,
    data.photos.some((p) => p.approved),
    afterDay || w.status === "memories",
  );
  add(
    "review-photos",
    "memories",
    `${data.photos.filter((p) => !p.approved).length} photographs await your review.`,
    "Only approved photographs enter the shared album.",
    "Review guest photographs",
    { section: "photos" },
    "Your guests can revisit the photographs you choose to share.",
    data.photos.filter((p) => !p.approved).length,
    afterDay ? 110 : 35,
    !data.photos.some((p) => !p.approved),
  );
  const chapterSpecs: [
    ChapterId,
    string,
    string,
    boolean[],
    string,
    Destination,
  ][] = [
    [
      "setup",
      "Set the scene",
      "Scene",
      steps.map((s) => s.done),
      `${steps.filter((s) => s.done).length} of ${steps.length} essentials reviewed`,
      { section: "setup" },
    ],
    [
      "people",
      "Bring your people",
      "People",
      [
        h.households.length > 0,
        h.households.length > 0 && !h.missingEmail.length,
        h.households.length > 0 && !h.unnamed.length,
      ],
      `${data.guests.length} guests · ${h.households.length} households`,
      { section: "guests" },
    ],
    [
      "invite",
      "Open the invitation",
      "Invite",
      [h.households.length > 0, invitationDone],
      `${h.households.filter((x) => h.invited.has(x.id)).length} of ${h.households.length} households have a live link`,
      { section: "invitations" },
    ],
    [
      "replies",
      "Hear from everyone",
      "Replies",
      [invitationDone, repliesDone],
      `${data.guests.filter((g) => g.status !== "pending").length} of ${data.guests.length} guests replied`,
      { section: "rsvps" },
    ],
    [
      "plan",
      "Put the day together",
      "Plan",
      [repliesDone, planDone],
      `${h.attending.length - h.unseated.length} of ${h.attending.length} attending guests seated`,
      { section: "seating" },
    ],
    // Readiness is a live review, not an invented completion inferred from opening a report.
    [
      "ready",
      "Ready for the day",
      "Ready",
      [planDone, readyDone],
      readyDone
        ? "Current plans reviewed for the day"
        : "Live documents for your final review",
      { section: "analytics" },
    ],
    [
      "memories",
      "Keep the memories",
      "Memories",
      [
        afterDay || w.status === "memories",
        data.photos.some((p) => p.approved),
      ],
      `${data.photos.filter((p) => p.approved).length} photographs in the album`,
      { section: "photos" },
    ],
  ];
  const chapters = chapterSpecs.map(
    ([id, title, shortTitle, conditions, summary, destination], i) => ({
      id,
      title,
      shortTitle,
      number: i + 1,
      completed: conditions.filter(Boolean).length,
      total: conditions.length,
      complete: conditions.every(Boolean),
      summary,
      destination,
    }),
  );
  const ranked = actions
    .filter((a) => a.applicable && !a.complete && !a.blockers.length)
    .sort(
      (a, b) => b.priority - a.priority || b.affectedCount - a.affectedCount,
    );
  const primaryAction = ranked[0];
  const currentChapter =
    chapters.find(
      (c) =>
        c.id ===
        (afterDay || w.status === "memories"
          ? "memories"
          : primaryAction?.chapter || "ready"),
    ) ??
    chapters.find((c) => !c.complete) ??
    chapters[0];
  return {
    health: h,
    deadlineOverdue: overdue,
    actions,
    primaryAction,
    secondaryActions: ranked.slice(1, 4),
    chapters,
    currentChapter,
    completedChapters: chapters.filter((c) => c.complete).length,
    totalChapters: chapters.length,
    canEdit: data.role !== "viewer",
    isPlanner: data.role === "planner",
    completedActionIds: actions.filter((a) => a.complete).map((a) => a.id),
  };
}
