# Planner outreach

## Do not contact

Designs by Lindy (`designsbylindy@gmail.com`) replied “STOP” on September 6, 2026. Exclude this address from every future outreach batch and follow-up. Do not send another sales reply.

## Replies checked September 8, 2026

Replies to Maren at Bow Valley Weddings, Sheena at Champagne & Roses, and Cathy at Creative Weddings were sent September 8. Maren received demo links and a request for suitable meeting times. Sheena received the guest demo for feedback. Cathy received an invitation concept offer that explicitly acknowledges there is no integration with her existing software. Do not resend these replies.

Fleur Weddings asked about per wedding pricing and agency partnerships. Blush & Bordeaux requested more information. Both received replies September 8 with the demo or pilot details and a choice of a conversation or written information. Await their replies; no meeting or pilot has been confirmed.

The current reconciled roster is saved locally in `artifacts/outreach-master-current.json` and `artifacts/outreach-master-current.md`. As of September 9 it contains 795 contacts and 801 sent messages. Gmail accepted all 100 messages in batch 12 and four addresses returned immediate delivery failures. Batch 12 concentrated on New Jersey and the affluent Northeast corridor, then used high value California and Florida destination markets to complete the verified pool. Gmail Sent and incoming mail must be checked again before any future outreach. Sent means accepted by Gmail, not confirmed inbox delivery. Automatic replies and bounces are separate from genuine interest.

Prioritize a short household walkthrough with Maren and feedback from Sheena. Cathy declined because of her existing planning workflow. No pilot or paid customer has been confirmed.

The goal of every message here is one thing: get a planner to watch a ten-minute
walkthrough. Not to explain the product, and not to sell a subscription.

The demo lives at `https://vow-motion.vercel.app/planners` (planner argument, not
the couple pitch) and `https://vow-motion.vercel.app/demo/riviera` (a working
guest example). **On the current free path
([OUTREACH-SENDING.md](OUTREACH-SENDING.md)) that link does not go in the first
cold email** — a free-host subdomain is a spam signal to Gmail, so the first
email asks for a reply and the link is sent in the reply. Once the domain is
live ([EMAIL-SETUP-RUNBOOK.md](EMAIL-SETUP-RUNBOOK.md)) it becomes
`https://vowmotion.ca/…` and can go in the first email again.

## What we can and cannot say yet

We have no planners using this and no weddings have run through it. Until that
changes, these are off the table: "used by Calgary planners", any guest or RSVP
count, any completion rate, and any named client. The pilot offer is the honest
version of that line, and it is a stronger opener than borrowed credibility.

What we can say, because it is true and demonstrable in the product: a household
opens a private invitation without an account; guests only ever see the events
they are invited to; replies arrive per person and per event with meals and
dietary notes; travel, seating, updates and photos live beside the same guest
list; six design directions; the couple's guests never see a spreadsheet.

Screenshots are safe to send. The demo weddings are fictional and their image
provenance is recorded in [ASSETS.md](ASSETS.md).

## Cold email

Sent from `jorti104@mtroyal.ca` through the Gmail connector (Claude drafts and
sends; see [OUTREACH-SENDING.md](OUTREACH-SENDING.md)). Plain text, no
attachments, no images, **no hyperlink in the first email** — a personal mailbox
with a free-host link in it is what tips Gmail into Junk. Keep it to what fits on
a phone screen. One ask: a reply.

### Rules that changed from the old template

1. **"I build Vow Motion." Not "part of the small team building Vow Motion."**
   There is no team; the plural is also a worn cold-email tell. First person
   singular is truer and reads better.
2. **No link in email 1.** Name the product and the demo in words; the call to
   action is "open to a quick look?". When they reply, *that* message carries
   `https://vow-motion.vercel.app/demo/riviera`.
3. **A real opt-out and a mailing address in the footer.** CASL requires both;
   Gmail looks for both. At this volume (≤15/day, 1-to-1 style) a reply-based
   opt-out is acceptable. Fill in a real address — home, a Canada Post PO box, or
   a Calgary virtual mailbox. **This is the one field nobody can fill in for you.**

### The footer — identical on every message, every variant

```
—
Aldo Ortiz · Vow Motion
2011 Ulster Rd NW, Calgary, AB  T2N 4C4
Prefer no more emails from me? Reply "unsubscribe" and I'll take you off.
```

Process every opt-out into [`../outreach/suppression.txt`](../outreach/suppression.txt)
the same day it arrives.

### Subject lines — rotate all four, never one per batch

Identical subjects from one sender in one morning is a bulk fingerprint Gmail is
built to catch. Cycle through these:

1. `A cleaner RSVP handoff for {{business}}`
2. `{{first_name}} — the guest list part, done once`
3. `Kitchen sheet, shuttle manifest, place cards — from the replies`
4. `Built the guest side so you don't rebuild it in four spreadsheets`

### Body — rotate these three; they differ in shape, not just wording. No links.

**Variant A — the output angle (~105 words)**

> Hi {{first_name}},
>
> I came across {{business}} and saw {{specific_detail}}.
>
> I build Vow Motion — the guest-facing side of a wedding. Each household opens
> one private invitation to only their events, RSVPs by person, and every reply
> becomes a working guest list: covers by meal with dietary notes, a shuttle
> manifest from your own transport question, place cards with table and meal.
>
> It sits next to whatever you plan on today — lists in by spreadsheet, documents
> out. Happy to send a link to a live sample-guest demo if it sounds useful —
> would it be, for any of your couples?
>
> *(footer)*

**Variant B — the problem angle (~85 words)**

> Hi {{first_name}},
>
> {{specific_detail}} — so you know the month-before scramble where the guest
> list, the RSVPs, the seating chart and the travel notes live in four different
> places.
>
> I build Vow Motion. It keeps them in one: guests RSVP through a private
> household invitation, and the meal counts, dietary notes and seating stay
> attached to the same list.
>
> Worth a ten-minute look? I'll send over a demo you can click through.
>
> *(footer)*

**Variant C — the short pilot ask (~70 words)**

> Hi {{first_name}},
>
> Quick one. I build Vow Motion — private household invitations, RSVP by person
> and event, and the caterer and seating documents built from the replies.
>
> I'm looking for two or three planners to run one real wedding through it, set
> up with me, no cost for that wedding.
>
> Open to a short walkthrough? I can send a demo link to look at first.
>
> *(footer)*

### The reply (when they answer)

Now the link is fine — an engaged thread has strong deliverability.

> Thanks {{first_name}}. Here's the sample-guest demo — open a household
> invitation and try the RSVP, nothing real is touched:
> https://vow-motion.vercel.app/demo/riviera
>
> And the planner view: https://vow-motion.vercel.app/planners
>
> If it's a fit, I set the first wedding up with you and there's no cost for it.
> Would a ten-minute call next week work?

Merge fields: `{{first_name}}` (use "there" if unknown — never send to a blank
salutation and prefer a named contact over `info@`/`hello@`), `{{business}}`,
`{{specific_detail}}` (one true, specific observation from their own site — this
is the anti-blast signal and must never be generic).

### If they don't reply

Once, about a week later, in the same thread, adding something rather than
repeating yourself. Still no link — same reason.

> Hi {{first_name}} — following up once. The part planners tell me is the
> problem: guest list, RSVPs, seating and travel notes in four places by the
> month before. Vow Motion is those in one, built from the guests' own replies.
>
> Happy to send a demo link if it's worth a look — otherwise I'll leave it here.
>
> *(footer)*

### Before every batch

- Weekdays only, respecting the ramp in [OUTREACH-SENDING.md](OUTREACH-SENDING.md)
  (5/day rising to 15/day max on this path), new prospects only.
- MX-check every recipient domain; drop dead domains, role addresses where a
  named contact exists, and obvious typos (`gmial.com`).
- Check every address against [`../outreach/suppression.txt`](../outreach/suppression.txt).
- Rotate subject and body variant per message; space sends across the day rather
  than firing them in one burst.

## The ten-minute walkthrough

Open two browser windows before the call. Do not build anything live.

1. **Set the frame.** "Pretend Elena and Matteo are your clients." Open the
   Studio on a demo wedding.
2. **The planner's side, four minutes.** The guest list with households and
   dietary notes. One private event, and which households can see it. The
   seating chart with a table filling up. An update going to a chosen audience,
   with the recipient count visible before it sends.
3. **The guest's side, four minutes.** Open a household invitation in the other
   window. The envelope, the invitation addressed to them, their weekend, the
   RSVP for the whole household, the wedding pass with their table.
4. **Close the loop, one minute.** Change something in the Studio and reload the
   invitation. That is the whole argument: entered once, seen by the guest.
5. **Ask, one minute.** "Would you put one wedding through this with me?"

Start the demo from `/planners`, not from a link you opened an hour ago — a
stale session shows a wedding you have already edited on camera.

## After the first pilot

Once one wedding has genuinely run, the evidence replaces the offer, and the
opener becomes what the planner did rather than what we are asking for. Record
the real numbers as they happen; do not estimate them.
