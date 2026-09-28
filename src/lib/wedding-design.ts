import { z } from "zod";
import { identitySchema, weddingIdentity } from "./identity";
import { worldSchema } from "./validation";
import { getWorld } from "./worlds";
import type { Wedding } from "./types";

export const placements = {
  opening: {
    name: "Opening background",
    uses: "Behind the envelope or seal, before the invitation opens",
  },
  invitation: {
    name: "Your invitation",
    uses: "Main invitation, envelope print and wedding pass",
  },
  story: { name: "Your story", uses: "Story photograph and memories accent" },
  venue: { name: "Your venue", uses: "Travel postcard" },
  details: {
    name: "Little details",
    uses: "Keepsake, programme and reply accents",
  },
} as const;
export type Placement = keyof typeof placements;
export const cropSchema = z.object({
  x: z.number().min(0).max(100).default(50),
  y: z.number().min(0).max(100).default(50),
  fit: z.enum(["cover", "contain"]).default("cover"),
});
export const photoPlacementSchema = z.object({
  asset: z.string().uuid(),
  crop: cropSchema,
  phone: cropSchema.optional(),
  worlds: z.record(z.string(), cropSchema).default({}),
  phoneWorlds: z.record(z.string(), cropSchema).optional(),
});
export const mediaSchema = z.object({
  opening: photoPlacementSchema.optional(),
  invitation: photoPlacementSchema.optional(),
  story: photoPlacementSchema.optional(),
  venue: photoPlacementSchema.optional(),
  details: photoPlacementSchema.optional(),
});
export const designSchema = z.object({
  world: worldSchema,
  opening: z.enum(["envelope", "seal"]),
  botanical: z.enum(["none", "cherry-blossom"]).default("none"),
  story: z.string().max(10000),
  identity: identitySchema,
  media: mediaSchema,
});
export type WeddingDesign = z.infer<typeof designSchema>;
export type DesignAsset = {
  id: string;
  name: string;
  width: number;
  height: number;
  bytes: number;
};
export type DesignState = {
  revision: number;
  draft: WeddingDesign;
  published: WeddingDesign;
  assets: DesignAsset[];
};
export function designFromWedding(
  wedding: Omit<Wedding, "owner_id">,
): WeddingDesign {
  return {
    world: wedding.world,
    opening: wedding.opening,
    botanical: weddingBotanical(wedding.settings),
    story: wedding.story,
    identity: weddingIdentity(wedding.settings),
    media: mediaSchema.catch({}).parse(wedding.settings.media ?? {}),
  };
}
export function withDesign(wedding: Wedding, design: WeddingDesign): Wedding {
  return {
    ...wedding,
    world: design.world,
    opening: design.opening,
    story: design.story,
    settings: {
      ...wedding.settings,
      identity: design.identity,
      media: design.media,
      botanical: design.botanical,
    },
  };
}

/** An optional stationery direction, independent of the six wedding worlds. */
export function weddingBotanical(settings: Record<string, unknown>) {
  return settings.botanical === "cherry-blossom" ? "cherry-blossom" : "none";
}
export function resolveWeddingMedia(
  wedding: Omit<Wedding, "owner_id">,
  placement: Placement,
  token?: string,
) {
  const defaults = {
    opening: getWorld(wedding.world).image,
    invitation: getWorld(wedding.world).image,
    venue: getWorld(wedding.world).image,
    story: "/images/wedding-evening.webp",
    details: "/images/wedding-details.webp",
  };
  const media = mediaSchema.catch({}).parse(wedding.settings.media ?? {});
  // The opening background borrows the invitation photo until the couple
  // chooses one of its own, which is how every opening looked before it had a
  // place of its own.
  const item =
    media[placement] ??
    (placement === "opening" ? media.invitation : undefined);
  const framing = item?.worlds[wedding.world] ?? item?.crop;
  const phoneFraming = item?.phoneWorlds?.[wedding.world] ?? item?.phone;
  // A background has no paper to sit on, so it always fills the screen even
  // when the photo it borrows is mounted whole elsewhere.
  const fill = <T extends { fit: string }>(frame: T | undefined) =>
    frame && placement === "opening" ? { ...frame, fit: "cover" as const } : frame;
  const crop = fill(framing);
  return {
    src: item
      ? `/api/design/assets/${item.asset}?wedding=${encodeURIComponent(wedding.id)}${token ? `&token=${encodeURIComponent(token)}` : ""}`
      : defaults[placement],
    fallback: defaults[placement],
    personal: Boolean(item),
    crop,
    phone: fill(phoneFraming) ?? crop,
  };
}

// Three-way merge: independent edits survive; conflicting fields require a choice.
export function designEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && designEqual(left[key], right[key]),
    )
  );
}
export function mergeDesign(
  base: WeddingDesign,
  local: WeddingDesign,
  remote: WeddingDesign,
) {
  // Older saved/local drafts predate optional art directions. Normalize before
  // comparing so a recovered draft cannot silently erase a published choice.
  base = designSchema.parse(base);
  local = designSchema.parse(local);
  remote = designSchema.parse(remote);
  const merged = structuredClone(remote);
  const conflicts: string[] = [];
  const equal = designEqual;
  for (const field of ["world", "opening", "botanical", "story"] as const) {
    if (!equal(local[field], base[field])) {
      if (
        !equal(remote[field], base[field]) &&
        !equal(remote[field], local[field])
      )
        conflicts.push(field);
      Object.assign(merged, { [field]: local[field] });
    }
  }
  for (const group of ["identity", "media"] as const) {
    for (const key of new Set([
      ...Object.keys(base[group]),
      ...Object.keys(local[group]),
      ...Object.keys(remote[group]),
    ])) {
      const b = base[group] as Record<string, unknown>,
        l = local[group] as Record<string, unknown>,
        r = remote[group] as Record<string, unknown>;
      if (!equal(l[key], b[key])) {
        if (!equal(r[key], b[key]) && !equal(r[key], l[key]))
          conflicts.push(`${group}.${key}`);
        if (l[key] === undefined)
          delete (merged[group] as Record<string, unknown>)[key];
        else (merged[group] as Record<string, unknown>)[key] = l[key];
      }
    }
  }
  return { merged, conflicts };
}
