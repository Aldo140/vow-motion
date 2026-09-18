-- Self-serve account deletion with a cancellable grace period, and a queue
-- so removing database records also removes the photo files those records
-- pointed at (the demo cleanup already deletes weddings without this).
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cancelled','completed')),
  cancelled_at timestamptz,
  completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_requests_one_pending
  ON account_deletion_requests(user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS account_deletion_requests_due
  ON account_deletion_requests(scheduled_for) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS pending_file_deletions (
  id text PRIMARY KEY,
  filename text NOT NULL,
  reason text NOT NULL DEFAULT 'account_deletion',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS pending_file_deletions_due
  ON pending_file_deletions(created_at) WHERE completed_at IS NULL;
