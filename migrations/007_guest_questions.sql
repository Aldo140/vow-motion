CREATE TABLE IF NOT EXISTS faqs (id text PRIMARY KEY, wedding_id text REFERENCES weddings(id) ON DELETE CASCADE, question text NOT NULL, question_es text DEFAULT '', answer text NOT NULL, answer_es text DEFAULT '', position integer NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS faqs_wedding_idx ON faqs(wedding_id);
