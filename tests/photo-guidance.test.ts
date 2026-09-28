import { expect, it } from "vitest";
import {
  photoFitNote,
  photoGuidance,
  photoSteps,
  suggestedPhotoFit,
} from "../src/lib/photo-guidance";
import { placements } from "../src/lib/wedding-design";
it("keeps panoramas and very tall images whole instead of heavily cropping them", () => {
  expect(suggestedPhotoFit({ width: 4000, height: 800 }, "invitation")).toBe(
    "contain",
  );
  expect(suggestedPhotoFit({ width: 600, height: 3000 }, "venue")).toBe(
    "contain",
  );
  expect(suggestedPhotoFit({ width: 1200, height: 1200 }, "details")).toBe(
    "cover",
  );
});
it("always fills the opening background, which has no paper to mount on", () => {
  expect(suggestedPhotoFit({ width: 4000, height: 800 }, "opening")).toBe(
    "cover",
  );
});
it("guides every place exactly once, in the order guests meet them", () => {
  expect([...photoSteps].sort()).toEqual(Object.keys(placements).sort());
  expect(photoSteps[0]).toBe("opening");
  expect(photoGuidance.invitation.priority).toBe("essential");
});
it("explains in plain words when a photo fights its frame", () => {
  expect(photoFitNote({ width: 400, height: 300 }, "story")).toMatch(/small/);
  expect(photoFitNote({ width: 3000, height: 2000 }, "story")).toMatch(
    /tall/,
  );
  expect(photoFitNote({ width: 2000, height: 3000 }, "venue")).toMatch(
    /wide/,
  );
  expect(photoFitNote({ width: 2400, height: 3000 }, "invitation")).toBeNull();
});
