import type { DesignAsset, Placement } from "./wedding-design";

/** The order a guest meets each photo, which is the order the guide asks. */
export const photoSteps: Placement[] = [
  "opening",
  "invitation",
  "story",
  "details",
  "venue",
];

export type PhotoPriority = "essential" | "recommended" | "optional";

export const photoGuidance: Record<
  Placement,
  {
    title: string;
    priority: PhotoPriority;
    /** What to have ready, for the checklist before the guide starts. */
    ready: string;
    where: string;
    best: string;
    avoid: string;
    /** What happens if the couple leaves this place alone. */
    skip: string;
    /** Frame shapes guests see (width / height), phone first then desktop. */
    ratios: number[];
  }
> = {
  opening: {
    title: "Opening background",
    priority: "optional",
    ready: "A scene: your venue, a landscape or flowers",
    where:
      "The very first screen, behind the envelope. It is darkened and mostly covered, so only the colours and edges come through.",
    best: "Scenery or texture: your venue, a landscape, flowers, a table setting.",
    avoid:
      "Close-ups of faces. They end up dim and hidden behind the envelope.",
    skip: "Skip it and your main invitation photo is used here, darkened.",
    ratios: [0.5, 1.6],
  },
  invitation: {
    title: "Main invitation photo",
    priority: "essential",
    ready: "One photo of the two of you",
    where:
      "The large photo guests see as soon as the invitation opens. It is also printed on the envelope and on each guest's wedding pass.",
    best: "The two of you. An engagement photo is perfect.",
    avoid:
      "Group photos, or faces right at the edge. Phones trim the sides of this frame.",
    skip: "Skip it and your invitation keeps its original artwork.",
    ratios: [0.8, 1.2],
  },
  story: {
    title: "Your story photo",
    priority: "recommended",
    ready: "A favourite memory together",
    where:
      "A printed photo beside your story, shown again in the memory album near the end.",
    best: "A candid moment: a trip, the proposal, an everyday favourite.",
    avoid: "Wide scenery. This frame is tall, so one clear subject reads best.",
    skip: "Skip it and your story keeps its original evening photograph.",
    ratios: [0.75, 0.8],
  },
  details: {
    title: "Little details",
    priority: "optional",
    ready: "Optional: a close-up of rings, flowers or an heirloom",
    where:
      "Small accents beside your story, schedule, reply card and keepsake. Always shown small, sometimes softened.",
    best: "A close-up: rings, flowers, your stationery, an heirloom.",
    avoid: "People. At this size faces are too small to recognise.",
    skip: "The original artwork already works well here. Replace it only with a close-up you love.",
    ratios: [0.75, 1.65],
  },
  venue: {
    title: "Travel postcard",
    priority: "optional",
    ready: "Optional: a wide photo of your venue or destination",
    where:
      "A postcard in the travel section, next to directions and where to stay.",
    best: "Your venue or destination, ideally a wide shot.",
    avoid: "Photos of the two of you. Guests look here to picture the place.",
    skip: "No good venue photo? The original postcard is a fine choice.",
    ratios: [1.1, 1.35],
  },
};

export const priorityLabel: Record<PhotoPriority, string> = {
  essential: "Most important",
  recommended: "Recommended",
  optional: "Optional",
};

// Prefer a paper mount when filling the different frames would crop most of a photo.
// This checks geometry only: it never claims to recognise faces or subjects.
export function suggestedPhotoFit(
  asset: Pick<DesignAsset, "width" | "height">,
  placement: Placement,
): "cover" | "contain" {
  // A background has no paper to mount on; it always fills the screen.
  if (placement === "opening") return "cover";
  const ratio = asset.width / asset.height;
  const retained = Math.min(
    ...photoGuidance[placement].ratios.map((target) =>
      Math.min(ratio / target, target / ratio),
    ),
  );
  return retained < 0.6 ? "contain" : "cover";
}

/** Which way a photo is shot, for plain-language fit advice. */
export function photoOrientation(asset: Pick<DesignAsset, "width" | "height">) {
  const ratio = asset.width / asset.height;
  return ratio > 1.15 ? "landscape" : ratio < 0.87 ? "portrait" : "square";
}

/** A short note when a chosen photo fights the frame it is going into. */
export function photoFitNote(
  asset: Pick<DesignAsset, "width" | "height">,
  placement: Placement,
): string | null {
  if (Math.min(asset.width, asset.height) < 600)
    return "This photo is small, so it may look soft. A larger copy will be sharper.";
  const shape = photoOrientation(asset);
  if (placement === "story" && shape === "landscape")
    return "This frame is tall, so the sides of a wide photo are trimmed. Tap the part you want to keep.";
  if (placement === "venue" && shape === "portrait")
    return "This postcard is wide, so the top and bottom of a tall photo are trimmed. Tap the part you want to keep.";
  if (placement === "invitation" && shape === "landscape")
    return "Phones show this photo tall, so the sides are trimmed. Tap to keep your faces in view.";
  if (suggestedPhotoFit(asset, placement) === "contain")
    return "We kept the whole photo in a paper mount so nothing important is cut off.";
  return null;
}
