import type { DesignAsset, Placement } from "./wedding-design";

export const photoGuidance: Record<
  Placement,
  { idea: string; shape: string; where: string; ratios: number[] }
> = {
  invitation: {
    idea: "The two of you, or a scene you love.",
    shape: "Portrait or landscape. Give faces a little space around the edges.",
    where: "The opening, main invitation and wedding pass",
    ratios: [0.8, 1.4],
  },
  story: {
    idea: "An engagement photo, a favourite trip, a memory together.",
    shape: "A photo with one clear subject works beautifully.",
    where: "The story section and memories accent",
    ratios: [0.75, 1.5],
  },
  venue: {
    idea: "Your actual venue, garden or destination.",
    shape: "A wide photo usually works best for this postcard.",
    where: "The travel and stay section",
    ratios: [1, 1.35],
  },
  details: {
    idea: "Flowers, rings, an heirloom or another meaningful detail.",
    shape: "A close-up with the subject near the middle.",
    where: "The keepsake, weekend schedule and RSVP",
    ratios: [0.8, 1],
  },
};

// Prefer a paper mount when filling the different frames would crop most of a photo.
// This checks geometry only: it never claims to recognise faces or subjects.
export function suggestedPhotoFit(
  asset: Pick<DesignAsset, "width" | "height">,
  placement: Placement,
): "cover" | "contain" {
  const ratio = asset.width / asset.height;
  const retained = Math.min(
    ...photoGuidance[placement].ratios.map((target) =>
      Math.min(ratio / target, target / ratio),
    ),
  );
  return retained < 0.6 ? "contain" : "cover";
}
