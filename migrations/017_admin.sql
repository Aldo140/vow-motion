-- Operator access for the dashboard at /admin. A normal signed-up account
-- (for example jorti104@mtroyal.ca) is promoted either by this flag or by
-- membership of the ADMIN_EMAILS environment list, so the first operator is
-- granted through the environment and can then promote others from the
-- dashboard without a database change.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS users_created_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS weddings_owner_idx ON weddings(owner_id);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at);
