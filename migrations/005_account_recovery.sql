CREATE TABLE IF NOT EXISTS password_reset_challenges (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, code_hash text NOT NULL, expires_at timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 0, consumed boolean NOT NULL DEFAULT false);
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_challenges(user_id);
