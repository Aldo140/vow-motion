import { rows } from "./db";

export type MomentumReportRow = {
  event: string;
  screen: string | null;
  demo: boolean;
  count: number;
  mean_elapsed_ms: number | null;
  mean_navigation_changes: number | null;
};

/** Anonymous event aggregates; never join these measurements to accounts. */
export function momentumReport() {
  return rows<MomentumReportRow>(`SELECT event, properties->>'screen' screen, demo, count(*)::int count,
    round(avg((properties->>'elapsed_ms')::numeric)) mean_elapsed_ms,
    round(avg((properties->>'navigation_count')::numeric),1) mean_navigation_changes
    FROM momentum_events WHERE created_at > now() - interval '30 days'
    GROUP BY event,properties->>'screen',demo ORDER BY event,screen`);
}
