-- The day-of table finder (/f/<slug>). Guests scan a QR at the venue, type
-- their name, and see their table, their people, and what's next. Its settings
-- live in weddings.settings->'finder'; this table holds the one thing it writes
-- back — a short note a guest can leave for the couple.
CREATE TABLE IF NOT EXISTS guestbook_notes (
  id text PRIMARY KEY,
  wedding_id text NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  guest_name text NOT NULL DEFAULT '',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guestbook_wedding_idx
  ON guestbook_notes(wedding_id, created_at DESC);
