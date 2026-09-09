# Outreach sending — current path (`jorti104@mtroyal.ca`)

No new account, no domain, no cost, no setup. You send from your existing
university address through the Gmail connector, which means **Claude drafts and
sends every email for you** — you approve batches and reply to interested
planners.

The domain upgrade ([EMAIL-SETUP-RUNBOOK.md](EMAIL-SETUP-RUNBOOK.md)) and the
dedicated-Gmail option are both parked. Nothing in either expires.

## What this path can and cannot do

`mtroyal.ca` is a real institutional domain with working authentication, so mail
from it *can* land. What put the earlier batches in Junk was not the address —
it was the pattern:

| Earlier batches | This path |
| --- | --- |
| 50–200 sent in a day | 5 → 15/day, ramped, spaced across hours |
| One subject line reused across all 50 | 4 subjects × 3 body shapes, rotated |
| `vow-motion.vercel.app` link in every message | **no link in the first email** — link goes in the reply |
| "just let me know" opt-out, no address | real footer: postal address + reply-to-unsubscribe |
| Role addresses, unverified, 3.6% bounce | MX-checked, role addresses dropped, bounces suppressed |
| Re-hitting people already emailed | new prospects only until copy for a re-approach exists |

Fixing those is most of the available gain without spending anything. Ceiling:
most Gmail recipients in the inbox, some still filtered. Not guaranteed.

Two hard limits on this path, because it is a personal mailbox not a bulk sender:

- **≤15 cold emails/day**, ramped from 5. More than that from one personal
  address is what tips Gmail from "person" to "bulk".
- **New prospects only.** The ~489 already contacted from this address
  (`artifacts/outreach-master-2026-09-08.json`) are a later re-approach with
  different copy — not a resend.

## Your part (about 2 minutes to start)

1. **Send me a postal address** for the footer — home, a Canada Post PO box, or a
   Calgary virtual mailbox. CASL requires a real mailing address in commercial
   email and Gmail checks for one. This is the only thing blocking the first
   batch.
2. Say **"send day 1"** whenever you want to start.

That's it. Optionally, set a signature in Gmail (Settings → General → Signature)
matching the footer so your own replies carry it too.

## What I do

For each day you say go:

1. Pull the next set of planner prospects (fresh, not on
   [`../outreach/suppression.txt`](../outreach/suppression.txt), not previously
   contacted).
2. MX-check each domain; drop dead domains, obvious typos, and role addresses
   (`info@`, `hello@`) where a named contact exists.
3. Research one true, specific detail per business from their own site — the
   line that proves it is not a blast.
4. Draft each email individually, rotating the four subjects and three body
   shapes in [PLANNER-OUTREACH.md](PLANNER-OUTREACH.md), footer included, **no
   link**.
5. Show you the batch. You approve or edit.
6. Send through the connector, **spaced out** across the working day — never a
   burst.
7. Track replies: interested → I draft the reply (that one carries the demo
   link); "unsubscribe" or bounce → straight into `suppression.txt` the same day.

## Volume ramp — weekdays only

**September 9 stop:** Gmail accepted 200 outreach messages today across the earlier send and batch 10. Five batch 10 addresses returned immediate delivery failures. Send no more from this mailbox today. Resume only after the mailbox has rested and the reply, bounce, spam, and opt out results have been reviewed.

| Days | Cold emails/day |
| --- | --- |
| 1–3 | 5 |
| 4–5 | 8 |
| Week 2 | 10–12 |
| Week 3+ | 15 **(hard cap on this path)** |

If Gmail shows a "confirm it's you" / sending-limit warning, or bounces exceed
2% on a day, stop for two days and resume one step lower.

## Checklist

- [ ] Postal address sent to Claude
- [ ] Gmail signature set to match the footer (optional)
- [ ] Day 1 batch of 5 approved and sent
- [ ] Ramp followed, capped at 15/day
- [ ] Every opt-out / bounce added to `outreach/suppression.txt` same day
- [ ] Not re-hitting the earlier 489 until re-approach copy exists
