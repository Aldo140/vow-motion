import { test, expect } from "@playwright/test";
import sharp from "sharp";

test("the reply card opens the RSVP and the album keeps private photos readable and keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/riviera");
  await page.getByRole("button", { name: "Open your invitation" }).click();
  const reply = page.locator(".reply-action");
  await reply.click();
  await expect(
    page.getByRole("dialog", { name: "Will you join us?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(reply).toBeFocused();
  const first = page.getByRole("button", {
    name: "Add the first memory",
    exact: true,
  });
  await first.click();
  await expect(
    page.getByRole("dialog", { name: "Share a memory" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(first).toBeFocused();
  const token = new URL(page.url()).pathname.split("/").at(-1);
  for (const [caption, background] of [
    ["The first dance", "#385c69"],
    ["One last embrace", "#896451"],
  ]) {
    const buffer = await sharp({
      create: { width: 400, height: 300, channels: 3, background },
    })
      .png()
      .toBuffer();
    const uploaded = await page.request.post(
      "/api/guest/photos?token=" + token,
      {
        multipart: {
          file: { name: "memory.png", mimeType: "image/png", buffer },
          caption,
        },
      },
    );
    expect(uploaded.status()).toBe(200);
  }
  await page.reload();
  await expect(page.locator(".album-photo")).toHaveCount(2);
  await expect(page.locator(".album-photo > small")).toHaveText([
    "Awaiting host approval",
    "Awaiting host approval",
  ]);
  const photo = page.locator(".album-photo").first();
  await photo.click();
  const viewer = page.getByRole("dialog", { name: "A wedding memory" });
  await expect(viewer).toBeVisible();
  await expect(page.locator(".album-viewer")).toBeFocused();
  await expect
    .poll(() =>
      viewer
        .locator(".album-viewer > img")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(viewer).toContainText(
    "Only your household and hosts can see this photo until it is approved.",
  );
  await page.keyboard.press("ArrowRight");
  await expect(viewer.locator(".album-viewer-controls > span")).toHaveText(
    "2 / 2",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(viewer.locator(".album-viewer-controls > span")).toHaveText(
    "1 / 2",
  );
  await page.keyboard.press("Escape");
  await expect(photo).toBeFocused();
  await page.locator(".language-switch").click();
  await page.locator(".album-browse").click();
  await expect(
    page.getByRole("dialog", { name: "Un recuerdo de la boda" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Siguiente recuerdo" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".album-browse")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
