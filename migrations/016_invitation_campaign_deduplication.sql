-- Protect a household from duplicate invitation sends when two browser tabs or
-- operators submit the same campaign at nearly the same time.
CREATE UNIQUE INDEX IF NOT EXISTS invitation_dispatches_one_active_send_idx
  ON invitation_dispatches(wedding_id,household_id)
  WHERE test=false AND status IN ('queued','development','sent','delivered');
