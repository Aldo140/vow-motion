CREATE TABLE IF NOT EXISTS invitation_dispatches (
  id text PRIMARY KEY,
  wedding_id text NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  household_id text NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  token_id text REFERENCES invitation_tokens(id) ON DELETE SET NULL,
  email text NOT NULL,
  subject text NOT NULL,
  test boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'queued',
  provider_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invitation_dispatches_wedding_idx
  ON invitation_dispatches(wedding_id, created_at DESC);
CREATE INDEX IF NOT EXISTS invitation_dispatches_household_idx
  ON invitation_dispatches(household_id, created_at DESC);
CREATE INDEX IF NOT EXISTS invitation_dispatches_provider_idx
  ON invitation_dispatches(provider_id);
CREATE UNIQUE INDEX IF NOT EXISTS invitation_dispatches_one_active_send_idx
  ON invitation_dispatches(wedding_id,household_id)
  WHERE test=false AND status IN ('queued','development','sent','delivered');
