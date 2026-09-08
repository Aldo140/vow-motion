import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    baseURL: "http://localhost:3000",
    // A baseline address for the run; tests/e2e/fixtures.ts gives each test its
    // own, so a long suite does not exhaust one visitor's demo allowance.
    extraHTTPHeaders: {
      "x-forwarded-for": `198.18.${process.pid % 256}.${Date.now() % 256}`,
    },
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  // Embedded PGlite allows a single process, so reuse a running server when one
  // is already serving the workspace and start one only when it is absent.
  webServer: {
    command: "npx next dev --hostname 127.0.0.1",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180000,
  },
});
