import { describe, expect, it } from "vitest";
import {
  designSchema,
  mergeDesign,
  resolveWeddingMedia,
  withDesign,
} from "../src/lib/wedding-design";
import type { Wedding } from "../src/lib/types";
const base = designSchema.parse({
  world: "riviera",
  opening: "envelope",
  story: "Our story",
  identity: {},
  media: {},
});
describe("design draft collaboration", () => {
  it("merges independent identity, world and photo changes", () => {
    const local = structuredClone(base),
      remote = structuredClone(base);
    local.identity.monogram = "AB";
    remote.world = "maison";
    remote.media.venue = {
      asset: "10000000-0000-4000-8000-000000000001",
      crop: { x: 20, y: 80, fit: "contain" },
      worlds: {},
    };
    const result = mergeDesign(base, local, remote);
    expect(result.conflicts).toEqual([]);
    expect(result.merged).toMatchObject({
      world: "maison",
      identity: { monogram: "AB" },
      media: remote.media,
    });
  });
  it("flags conflicting choices and deletion versus replacement", () => {
    const original = structuredClone(base);
    original.media.invitation = {
      asset: "10000000-0000-4000-8000-000000000001",
      crop: { x: 50, y: 50, fit: "cover" },
      worlds: {},
    };
    const local = structuredClone(original),
      remote = structuredClone(original);
    delete local.media.invitation;
    remote.media.invitation!.crop.x = 90;
    expect(mergeDesign(original, local, remote).conflicts).toEqual([
      "media.invitation",
    ]);
    expect(original.media.invitation?.crop.x).toBe(50);
  });
  it("keeps world-specific framing and safely restores default artwork", () => {
    const design = structuredClone(base);
    design.media.invitation = {
      asset: "10000000-0000-4000-8000-000000000001",
      crop: { x: 50, y: 50, fit: "cover" },
      worlds: { riviera: { x: 10, y: 20, fit: "contain" } },
      phone: { x: 70, y: 60, fit: "cover" },
    };
    const wedding = withDesign({ id: "w", settings: {} } as Wedding, design);
    expect(resolveWeddingMedia(wedding, "invitation").crop?.x).toBe(10);
    expect(resolveWeddingMedia(wedding, "invitation").phone?.x).toBe(70);
    expect(resolveWeddingMedia(wedding, "venue").personal).toBe(false);
    expect(
      resolveWeddingMedia({ ...wedding, settings: {} }, "invitation").src,
    ).toBe("/images/riviera.webp");
  });
});
