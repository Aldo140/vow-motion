-- Moving a wedding to a different account. Modeled on the existing
-- collaborator pattern (invite by email, activates once that email's own
-- account is verified) but requires the recipient's explicit acceptance,
-- since this hands over full control (billing, deletion, everything) rather
-- than shared access.
CREATE TABLE IF NOT EXISTS ownership_transfers (
  id text PRIMARY KEY,
  wedding_id text NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  from_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  resolved_at timestamptz
);
-- Only one open transfer per wedding at a time.
CREATE UNIQUE INDEX IF NOT EXISTS ownership_transfers_one_pending
  ON ownership_transfers(wedding_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS ownership_transfers_recipient
  ON ownership_transfers(to_email) WHERE status = 'pending';
