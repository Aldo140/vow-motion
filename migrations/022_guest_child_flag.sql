-- Lets a couple mark a household member as a child, so the invitation and
-- RSVP can show that distinctly instead of leaving every name looking like
-- an equivalent adult invitee or an unconfirmed plus-one.
ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_child boolean NOT NULL DEFAULT false;
