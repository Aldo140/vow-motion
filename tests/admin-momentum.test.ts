import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminMomentum from "../src/components/admin-momentum";
import type { MomentumReportRow } from "../src/lib/momentum-report";

describe("operator Momentum report", () => {
  it("keeps demo counts out of the initial real-activity report", () => {
    const row: MomentumReportRow = {
      event: "recommended_action_completed",
      screen: "guests",
      demo: false,
      count: 7,
      mean_elapsed_ms: 65000,
      mean_navigation_changes: 2.5,
    };
    const html = renderToStaticMarkup(
      createElement(AdminMomentum, {
        rows: [row, { ...row, demo: true, count: 9999 }],
      }),
    );
    expect(html).toContain("<strong>7</strong>");
    expect(html).not.toContain("9999");
    expect(html).toContain("1m 5s");
    expect(html).toContain("not unique people or a conversion funnel");
  });

  it("shows an honest empty state when only demo activity exists", () => {
    const html = renderToStaticMarkup(
      createElement(AdminMomentum, {
        rows: [
          {
            event: "studio_opened",
            screen: null,
            demo: true,
            count: 3,
            mean_elapsed_ms: null,
            mean_navigation_changes: null,
          },
        ],
      }),
    );
    expect(html).toContain("No real Momentum activity recorded");
    expect(html).not.toContain("ops-momentum-totals");
  });
});
