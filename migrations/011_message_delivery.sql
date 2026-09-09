-- A send that dies mid-flight used to leave its message pinned at 'processing'
-- with no control left in the Studio and no way back. Recording when the status
-- last moved lets a stalled send be reclaimed, and lets the Studio tell the
-- difference between "sending right now" and "stopped some time ago".
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS deliveries_message_idx ON deliveries(message_id);
