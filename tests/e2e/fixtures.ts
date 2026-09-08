import { test as base, expect } from "@playwright/test";

// Creating a private demo is rate limited per address, as it should be. Each
// test is a different visitor, so give each one its own, rather than letting a
// long suite exhaust a single allowance and meet the friendly "try later" page.
let visitor = 0;
export const test = base.extend({
  // The second argument is Playwright's fixture-provider; it is named away
  // from "use" so the React hooks lint rule does not mistake it for a hook.
  extraHTTPHeaders: async ({ extraHTTPHeaders }, provide, testInfo) => {
    visitor += 1;
    await provide({
      ...extraHTTPHeaders,
      "x-forwarded-for": `198.18.${testInfo.workerIndex % 256}.${visitor % 256}`,
    });
  },
});
export { expect };
export type { APIRequestContext, Page, Locator } from "@playwright/test";
