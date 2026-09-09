CREATE TABLE contact_enquiries (
  id text PRIMARY KEY,
  digest text NOT NULL,
  role text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
