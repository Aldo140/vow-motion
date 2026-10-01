import type { ShareCard } from "./seo";

/**
 * Every long-form public page outside the core marketing site. One list feeds
 * the guides hub, the "keep reading" cards, the footer and the sitemap, so a
 * new page only has to be added here once.
 */
export type ContentEntry = {
  path: string;
  kind: "Guide" | "Feature";
  title: string;
  summary: string;
  image: string;
  card: ShareCard;
  /** ISO date the content was last meaningfully revised. */
  updated: string;
};

export const features: ContentEntry[] = [
  {
    path: "/digital-wedding-invitations",
    kind: "Feature",
    title: "Digital wedding invitations",
    summary:
      "A designed invitation each household opens from its own link, with replies, events and travel in the same place.",
    image: "/images/invitation-silk.webp",
    card: "invitations",
    updated: "2026-10-01",
  },
  {
    path: "/wedding-rsvp",
    kind: "Feature",
    title: "Online wedding RSVPs",
    summary:
      "Household replies for every event, with meals, dietary needs and your own questions collected as they come in.",
    image: "/images/wedding-details.webp",
    card: "rsvp",
    updated: "2026-10-01",
  },
];

export const guides: ContentEntry[] = [
  {
    path: "/guides/wedding-invitation-wording",
    kind: "Guide",
    title: "Wedding invitation wording, with examples",
    summary:
      "What every invitation needs to say, in what order, with wording for formal, relaxed, family-hosted and adults-only weddings.",
    image: "/images/hero-maison.webp",
    card: "wording",
    updated: "2026-10-01",
  },
  {
    path: "/guides/when-are-wedding-rsvps-due",
    kind: "Guide",
    title: "When should wedding RSVPs be due?",
    summary:
      "How to set an RSVP deadline that works backwards from your caterer and venue, and what to do about the guests who miss it.",
    image: "/images/wedding-evening.webp",
    card: "deadline",
    updated: "2026-10-01",
  },
  {
    path: "/guides/digital-vs-paper-wedding-invitations",
    kind: "Guide",
    title: "Digital vs paper wedding invitations",
    summary:
      "An honest comparison of cost, timing, replies and keepsake value, and when it makes sense to do both.",
    image: "/images/garden.webp",
    card: "compare",
    updated: "2026-10-01",
  },
];

export const contentPages = [...features, ...guides];

/** Up to `count` other pages to suggest at the foot of `path`. */
export function relatedTo(path: string, count = 3) {
  return contentPages.filter((entry) => entry.path !== path).slice(0, count);
}
