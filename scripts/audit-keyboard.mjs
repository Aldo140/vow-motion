import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ baseURL: "http://localhost:3000" })).newPage();

await page.request.post("/api/demo");
const weddings = await (await page.request.get("/api/weddings")).json();
await page.goto(`/studio/invitations?wid=${weddings[0].id}`);

// Open the "Send invitations" modal with the keyboard, not a click.
await page.getByRole("button", { name: /send invitations/i }).focus();
await page.keyboard.press("Enter");
await page.locator("dialog[open]").waitFor();

// Tab all the way around the dialog and confirm focus never escapes it.
const dialogHandle = await page.$("dialog[open]");
let escaped = false;
for (let i = 0; i < 40; i++) {
  await page.keyboard.press("Tab");
  const insideDialog = await page.evaluate(
    (dialog) => dialog.contains(document.activeElement),
    dialogHandle,
  );
  if (!insideDialog) {
    escaped = true;
    break;
  }
}
console.log("focus stayed inside the dialog while tabbing:", !escaped);

// Escape closes it and returns focus to the trigger button.
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
const dialogStillOpen = await page.locator("dialog[open]").count();
const activeIsTrigger = await page.evaluate(
  () => document.activeElement?.textContent?.includes("Send invitations") ?? false,
);
console.log("escape closed the dialog:", dialogStillOpen === 0);
console.log("focus returned to the trigger button:", activeIsTrigger);

await browser.close();
