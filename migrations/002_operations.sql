CREATE TABLE IF NOT EXISTS verification_challenges (id text PRIMARY KEY, wedding_id text REFERENCES weddings(id) ON DELETE CASCADE, household_id text REFERENCES households(id) ON DELETE CASCADE, code_hash text NOT NULL, expires_at timestamptz NOT NULL, attempts integer DEFAULT 0, consumed boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS webhook_events (id text PRIMARY KEY, provider text NOT NULL, created_at timestamptz DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS delivery_message_guest_idx ON deliveries(message_id,guest_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_wedding_idx ON subscriptions(wedding_id);
