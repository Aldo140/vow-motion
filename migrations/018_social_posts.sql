-- Brand social publishing. One row per post the founder queues from /admin/content;
-- the worker publishes any whose scheduled_at has passed, through the Instagram
-- Graph API. media holds an ordered list of {url,type} — one entry for a single
-- image or reel, several for a carousel.
CREATE TABLE IF NOT EXISTS social_posts (
  id text PRIMARY KEY,
  platform text NOT NULL DEFAULT 'instagram',
  caption text NOT NULL DEFAULT '',
  media jsonb NOT NULL DEFAULT '[]',
  kind text NOT NULL DEFAULT 'image' CHECK (kind IN ('image','carousel','reel')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','publishing','posted','failed','canceled')),
  scheduled_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  container_id text,
  permalink text,
  error text,
  created_by text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  posted_at timestamptz
);
CREATE INDEX IF NOT EXISTS social_posts_due_idx
  ON social_posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS social_posts_created_idx
  ON social_posts(created_at DESC);

-- The long-lived Instagram token expires about every 60 days and has to be
-- refreshed while still valid. One row, id='instagram', updated by the worker.
CREATE TABLE IF NOT EXISTS social_tokens (
  id text PRIMARY KEY,
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now()
);
