import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ baseURL: "http://localhost:3000" })).newPage();
const violations = [];
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error" && /Content Security Policy|CSP/i.test(msg.text()))
    violations.push(msg.text());
});
page.on("pageerror", (e) => errors.push(e.message));

for (const url of ["/", "/login", "/privacy", "/design-preview"]) {
  await page.goto(url, { waitUntil: "networkidle" });
  console.log(url, "loaded with no thrown error");
}

// A real interaction that depends on client-side JS (Next's own inline
// bootstrap scripts, which is exactly what the nonce has to authorize).
await page.goto("/login");
await page.getByRole("button", { name: /try a private demo/i }).click();
await page.waitForURL(/\/(studio|i\/)/, { timeout: 15000 });
console.log("demo button navigation works (client JS ran):", page.url());

console.log("CSP violations logged in console:", violations.length, violations);
console.log("page errors:", errors.length, errors);
await browser.close();
