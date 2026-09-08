ALTER TABLE invitation_tokens ADD COLUMN IF NOT EXISTS preview boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS pilot_feedback (
  id text PRIMARY KEY,
  wedding_id text NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  author_id text NOT NULL REFERENCES users(id),
  screen text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in-progress','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS guest_requests (
  id text PRIMARY KEY,
  wedding_id text NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  household_id text NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pilot_feedback_wedding_idx ON pilot_feedback(wedding_id);
CREATE INDEX IF NOT EXISTS guest_requests_wedding_idx ON guest_requests(wedding_id);
