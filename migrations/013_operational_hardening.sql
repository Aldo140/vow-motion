-- Stripe sends the same event more than once and Checkout can be retried. The
-- application upserts by wedding, so the database must enforce that invariant.
DELETE FROM subscriptions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      row_number() OVER (
        PARTITION BY wedding_id
        ORDER BY (status = 'paid') DESC, created_at DESC, id DESC
      ) AS duplicate_number
    FROM subscriptions
  ) ranked
  WHERE duplicate_number > 1
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_wedding_unique
  ON subscriptions(wedding_id);

CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS invitation_tokens_expiry_idx
  ON invitation_tokens(expires_at);
CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx ON rate_limits(expires_at);
