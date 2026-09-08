ALTER TABLE weddings ADD COLUMN IF NOT EXISTS opening text NOT NULL DEFAULT 'envelope';
ALTER TABLE weddings DROP CONSTRAINT IF EXISTS weddings_opening_check;
ALTER TABLE weddings ADD CONSTRAINT weddings_opening_check CHECK (opening IN ('envelope','seal'));
