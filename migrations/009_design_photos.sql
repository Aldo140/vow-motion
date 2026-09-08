CREATE TABLE design_assets (
  id text PRIMARY KEY,
  wedding_id text NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_filename text NOT NULL,
  name text NOT NULL,
  digest text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(wedding_id, digest)
);
CREATE TABLE wedding_designs (
  wedding_id text PRIMARY KEY REFERENCES weddings(id) ON DELETE CASCADE,
  revision integer NOT NULL DEFAULT 0,
  draft jsonb NOT NULL,
  published jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
