-- 'sent' in this codebase meant "Resend accepted the request", never "the guest
-- received it", and nothing ever revised that value. A guest whose invitation
-- hard-bounced looked exactly like a guest who read it. These columns hold the
-- rest of the lifecycle, reported back over the Resend webhook, plus the retry
-- bookkeeping a transient failure needs so one 429 does not lose an invitation.
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS bounce_type text;

-- A withdrawal has to outlive a spreadsheet re-import. `consent` is rewritten
-- wholesale by the guest import and by the couple's own edits, so the fact of an
-- unsubscribe is recorded separately and treated as permanent.
ALTER TABLE guests ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS suppressed_reason text;

-- provider_id is the Resend email id and the only join key a webhook carries.
CREATE INDEX IF NOT EXISTS deliveries_provider_idx ON deliveries(provider_id);
CREATE INDEX IF NOT EXISTS deliveries_retry_idx ON deliveries(next_attempt_at);
