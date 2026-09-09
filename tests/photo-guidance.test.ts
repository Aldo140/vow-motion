import { expect, it } from "vitest";
import { suggestedPhotoFit } from "../src/lib/photo-guidance";
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
