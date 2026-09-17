"use client";

import { useState } from "react";
import type { MomentumReportRow } from "@/lib/momentum-report";

const labels: Record<string, string> = {
  studio_opened: "Studio visits",
  screen_viewed: "Screen views",
  recommended_action_shown: "Next steps shown",
  recommended_action_selected: "Next steps selected",
  recommended_action_completed: "Next steps completed",
  onboarding_step_completed: "Onboarding steps saved",
  chapter_completed: "Chapters completed",
  first_productive_action: "First productive actions",
  first_household: "First households added",
  first_invitation: "First invitations recorded",
  invitation_sending_started: "Sending attempts started",
  invitation_sending_completed: "Sending attempts finished",
  rsvp_blocker_resolved: "Reply blockers resolved",
  workflow_abandoned: "Left with an unresolved step",
};

function duration(value: number | null) {
  if (value === null) return "—";
  const seconds = Math.round(Number(value) / 1000);
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function AdminMomentum({ rows }: { rows: MomentumReportRow[] }) {
  const [demo, setDemo] = useState(false);
  const selected = rows.filter((row) => row.demo === demo);
  const count = (event: string) =>
    selected
      .filter((r) => r.event === event)
      .reduce((sum, r) => sum + Number(r.count), 0);
  return (
    <section
      className="ops-card ops-momentum"
      aria-labelledby="ops-momentum-title"
    >
      <div className="panel-title">
        <div>
          <p className="eyebrow">LAST 30 DAYS</p>
          <h2 id="ops-momentum-title">Is the next step helping?</h2>
        </div>
        <div className="filter-tabs" aria-label="Momentum activity source">
          <button
            aria-pressed={!demo}
            className={!demo ? "active" : ""}
            onClick={() => setDemo(false)}
          >
            Real activity
          </button>
          <button
            aria-pressed={demo}
            className={demo ? "active" : ""}
            onClick={() => setDemo(true)}
          >
            Demo activity
          </button>
        </div>
      </div>
      <p className="ops-momentum-note">
        Anonymous event counts, not unique people or a conversion funnel. Time
        starts at the first Studio visit in the browser tab. No wedding or guest
        content is collected.
      </p>
      {selected.length ? (
        <>
          <div className="ops-momentum-totals">
            {[
              ["recommended_action_selected", "Next steps selected"],
              ["recommended_action_completed", "Next steps completed"],
              ["chapter_completed", "Chapters completed"],
              ["workflow_abandoned", "Unresolved exits"],
            ].map(([event, label]) => (
              <div key={event}>
                <strong>{count(event).toLocaleString()}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <details>
            <summary>Explore events and effort by screen</summary>
            <div className="table-container">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Screen</th>
                    <th>Count</th>
                    <th>Mean elapsed time</th>
                    <th>Mean navigation changes</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((row) => (
                    <tr key={`${row.event}-${row.screen}`}>
                      <td>
                        {labels[row.event] || row.event.replaceAll("_", " ")}
                      </td>
                      <td>{row.screen || "Across Studio"}</td>
                      <td>{row.count}</td>
                      <td>{duration(row.mean_elapsed_ms)}</td>
                      <td>
                        {row.mean_navigation_changes === null
                          ? "—"
                          : Number(row.mean_navigation_changes).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <div className="empty-state">
          <p>
            No {demo ? "demo" : "real"} Momentum activity recorded in the last
            30 days.
          </p>
          <small>
            Measurements appear as people use Studio. Browsers with Do Not Track
            enabled do not send events.
          </small>
        </div>
      )}
    </section>
  );
}
