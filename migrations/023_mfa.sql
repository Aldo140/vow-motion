-- Optional TOTP two-factor authentication, plus one-time backup codes for
-- when the authenticator device is unavailable.
CREATE TABLE IF NOT EXISTS user_mfa (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  backup_codes jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

-- A short-lived hold between "password verified" and "TOTP verified" during
-- login, so a session is never issued on password alone once MFA is on.
CREATE TABLE IF NOT EXISTS mfa_login_challenges (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS mfa_login_challenges_expiry
  ON mfa_login_challenges(expires_at);

-- "Recently reauthenticated" for step-up actions like a full data export,
-- which is a GET download and so cannot itself carry a password/MFA code.
CREATE TABLE IF NOT EXISTS recent_reauth (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL
);
