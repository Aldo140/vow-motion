# Email sending setup — what's actually live

Supersedes [EMAIL-SETUP-RUNBOOK.md](EMAIL-SETUP-RUNBOOK.md) (Zoho-based, never
used). This is the real, working setup as of September 21, 2026.

## The pieces

- **Domain:** `vowmotionweddings.com`, registered via Cloudflare, DNS hosted
  there. Also being pointed at the Vercel deployment as the app's primary
  domain (replacing `vow-motion.vercel.app` in all outward-facing links).
- **Sending address:** `aldo@vowmotionweddings.com`
- **Inbound routing:** Cloudflare Email Routing (free) forwards
  `aldo@vowmotionweddings.com` → `mrotiz14@gmail.com`. No paid mailbox exists;
  this address only receives via the forward.
- **Outbound sending:** Gmail's "Send mail as" on `mrotiz14@gmail.com`, relayed
  through Brevo's SMTP server (`smtp-relay.brevo.com:587`), authenticated with
  a Brevo SMTP key. This is what actually lets Gmail send with a `From:` of
  `aldo@vowmotionweddings.com`.
- **Domain authentication:** DKIM (2 CNAME records, Brevo-issued), SPF (already
  covered by Cloudflare Email Routing's record), DMARC (`p=none`, reports to
  Brevo). Verified live: a real test send to an external mailbox
  (`jorti104@mtroyal.ca`) showed **SPF: PASS, DKIM: PASS, DMARC: PASS** in
  Gmail's "Show original" view.
- **Automation:** Brevo also has a transactional HTTP API
  (`api.brevo.com/v3/smtp/email`, authenticated with a separate `xkeysib-...`
  API key, not the SMTP key) that can send as `aldo@vowmotionweddings.com`
  directly — this is what lets sends be scripted instead of pasted into
  Gmail's compose window by hand. Real-world sends (actual emails to actual
  people) are blocked by Claude Code's auto-mode classifier as a "real-world
  transaction" regardless of local Bash permission rules — a human has to run
  the send command themselves.

## Known dead ends (don't retry these)

- **Zoho Mail's free plan** no longer exists in their signup flow — only paid
  plans (Mail Lite ~$1.25/user/month and up). `EMAIL-SETUP-RUNBOOK.md` is
  stale on this point.
- **Gmail "Send mail as" with no SMTP** only works for adding another Google
  account you own — a fully external custom domain always requires real SMTP
  credentials. There is no free "just send through Gmail" option for a
  domain Google doesn't host.
- **Cloudflare Email Routing** is receive-only. It has no outbound SMTP relay.
- **Gmail API (the `mcp__claude_ai_Gmail__*` connector tools)** cannot send
  with a custom `From:` alias (`send_message` has no `from` override), and
  cannot read `Authentication-Results`/SPF/DKIM/DMARC verdicts even in `RAW`
  or `FULL_CONTENT` format — that data only exists in the web "Show original"
  view. Both are hard API limitations, not something worth re-attempting.
- **Self-to-self test sends** (same Gmail account on both ends) don't get
  routed through Gmail's normal authentication-checking pipeline, so they
  never show SPF/DKIM/DMARC verdicts at all — always test with a genuinely
  separate mailbox.

## Warmup status

2-week warmup required before any real cold outreach, per
[PLANNER-OUTREACH.md](PLANNER-OUTREACH.md) and [OUTREACH-SENDING.md](OUTREACH-SENDING.md).

**Day 1 — September 21, 2026:** 5 genuine emails sent to real contacts pulled
from `mrotiz14@gmail.com`'s own sent/reply history (people with an actual prior
back-and-forth, not cold prospects): Agnes Chen, Nicole (nicsdelite), Matt
Stuart, Aldo's own alternate address, and Andrew Todd (sent twice by accident,
low stakes). Do not re-warm these same contacts again — the ramp needs new
genuine exchanges each day, and repeatedly emailing the same five people reads
as odd, not as organic mailbox activity.

No cold outreach batches have been sent from this address yet. Continue the
ramp (5/day → 8/day → 10-12/day → 15/day) with real contacts before any
planner-prospect sending begins.
