# outreach/

Working files for the planner cold-email campaign.

- Strategy + copy + compliance: [../docs/PLANNER-OUTREACH.md](../docs/PLANNER-OUTREACH.md)
- **Current** sending setup: [../docs/OUTREACH-SENDING.md](../docs/OUTREACH-SENDING.md)
  — sent from `jorti104@mtroyal.ca` via the Gmail connector; Claude drafts + sends.
- Parked upgrade (own domain): [../docs/EMAIL-SETUP-RUNBOOK.md](../docs/EMAIL-SETUP-RUNBOOK.md)

## Files

- **`suppression.txt`** — never email anyone on this list. Add a line the day any
  opt-out or hard bounce arrives. Checked before every batch.

## How sending works

1. You send Claude a postal address for the footer, then say "send day N".
2. Claude pulls fresh prospects (not in `suppression.txt`, not already
   contacted), MX-checks them, researches one specific detail each, and drafts
   every email — rotating 4 subjects × 3 body shapes, footer included, **no link**.
3. You approve; Claude sends through the connector, spaced across the day.
4. First emails carry no link — the ask is a reply. The demo link goes in the
   reply once a planner responds.
5. Volume ramps 5/day → 15/day max. Weekdays only. New prospects only.

The 595 addresses already contacted from `jorti104@mtroyal.ca` (current roster in
`artifacts/outreach-master-current.json`) are a *re-approach* later with new
copy — not a resend.
