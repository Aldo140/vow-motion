CREATE TABLE IF NOT EXISTS story_sessions (token_hash text PRIMARY KEY, wedding_id text REFERENCES weddings(id) ON DELETE CASCADE, password_version text NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS story_session_wedding_idx ON story_sessions(wedding_id);
