# Email deliverability and cold-outreach infrastructure

Prepared 8 September 2026. Revised 9 September 2026 to run on free tiers.
Nothing in this document has been purchased and no DNS record has been created.

**The entire stack below is free except for domain registration, which is
~$20.88/year for two domains (~$10.44 for one).** That single cost is
unavoidable and section 3 explains exactly why. Everything else — DNS, the app's
transactional email, the outreach mailbox, inbound forwarding — runs on
permanent free tiers, at the price of roughly 20–40 minutes a day of manual
sending during the five-week ramp. Section 5 has the full accounting and section
2 has the honest list of what is given up.

## 1. What is actually wrong

Three separate problems, in order of how much damage each is doing.

**There is no owned domain.** The Vercel project `vow-motion`
(`prj_v4tcOdCNvdxqdYs5k6C3Lfs8qSKH`, team `aldos-projects-bbd0f155`) has three
domains attached and all three are Vercel-issued:

- `vow-motion.vercel.app`
- `vow-motion-aldos-projects-bbd0f155.vercel.app`
- `vow-motion-git-main-aldos-projects-bbd0f155.vercel.app`

No custom domain exists anywhere in the repository either. `.env.example` still
carries the placeholder `EMAIL_FROM=Vow Motion <invitations@your-verified-domain.com>`,
`docs/DEPLOYMENT.md` lists "domain ownership" under remaining operator setup, and
`docs/MASTER-BRIEF.md` records `vowmotion.com` only as a *potential* domain. So
there is no apex to take a subdomain of yet, and `vercel.app` cannot be used —
it is on the Public Suffix List, Vercel controls its DNS, and you cannot publish
SPF, DKIM or DMARC under it. A domain purchase is therefore step one, not an
optional upgrade.

**The mail was sent from a university account.** All 282 messages went out from
`jorti104@mtroyal.ca`. Two consequences: Mount Royal's acceptable-use policy
almost certainly does not permit 282 commercial solicitations from a student
account, and every spam complaint lands on a domain shared with the whole
university. Stop sending outreach from this address today, regardless of how long
the rest of this setup takes.

**The one link in every message points at `vow-motion.vercel.app`.** Free-hosting
subdomains have no independent domain reputation, are heavily used for phishing,
and are a strong negative signal at Gmail and Outlook. Given the recipient list is
overwhelmingly Gmail and Google Workspace, this is probably the single biggest
content-side cause of junk placement.

### Measured baseline

From `artifacts/outreach-master-2026-09-08.json` (278 contacts, 282 sent):

| Signal | Count | Rate | Assessment |
| --- | --- | --- | --- |
| Bounced | 10 | 3.6% | Too high. Under 2% is the working target; over 3% is read as a poorly-sourced list |
| Automatic replies | 16 | 5.8% | Neutral |
| Genuine interested replies | 4 | 1.4% | Low but not abnormal for cold |
| Explicit opt-out ("STOP") | 1 | 0.4% | Already excluded in `docs/PLANNER-OUTREACH.md` |
| Awaiting reply | 244 | 87.8% | Consistent with junk-folder placement |

The 3.6% bounce rate matters on its own: every hard bounce is a direct hit to
sender reputation, and mailbox providers weight it heavily for new senders.

---

## 2. The setup: two lanes, both on free tiers

Do not run app mail and cold outreach through the same domain or the same
provider. They have opposite risk profiles, and one Acceptable Use Policy
violation on the outreach side would otherwise take down wedding invitations for
real customers. That separation survives the move to free tiers intact — in fact
free tiers make it *more* important, because a terminated free account gets no
support queue and no appeal.

### Lane A — application mail (invitations, RSVP, verification)

- Domain: the brand domain, e.g. `vowmotion.ca`
- Sending identity: a **subdomain**, `send.vowmotion.ca`
- Provider: **Resend free tier** — already wired up in `src/lib/providers.ts`
- Cost: **$0**
- Recipients: opted-in guests and account holders only

The subdomain matters exactly as before: if `send.vowmotion.ca` develops a
reputation problem, the apex that serves the website and receives your business
mail is insulated. Never send from the apex.

Resend's free tier carries 3,000 emails/month, **100 emails/day**, one verified
domain, 30-day log retention, and webhooks. The daily cap is the binding one and
it is the same ceiling as the monthly figure restated — 3,000/month averages
exactly 100/day, so there is no burst headroom. One wedding sending 150
invitations in a single evening exceeds it. Section 8d's retry queue plus the
15-minute cron happens to be the right shape for this: over-cap sends fail with a
429, get classified retryable, and drain the next day. Worth knowing before it
happens rather than after.

One verified domain on the free tier also means you cannot have separate staging
and production sending domains. Keep development on the existing development
outbox (`deliver()` already returns `status: "development"` when
`RESEND_API_KEY` is unset) rather than burning the one domain slot on staging.

### Lane B — cold outreach to planners

- Domain: a **separate registered domain**, e.g. `vowmotionhq.com`
- Sending identity: the apex of that domain, `aldo@vowmotionhq.com`
- Provider: **Zoho Mail Forever Free** — a real mailbox you own
- Sequencer: **none — sent by hand**
- Cost: **$0**
- Recipients: cold

**No email API can legitimately carry this campaign, at any price.** This is the
finding that shapes the whole lane, and it is a terms problem, not a budget
problem:

| Provider | Free tier today | Cold outreach permitted? |
| --- | --- | --- |
| Resend | 3,000/mo, 100/day | **No.** AUP prohibits "unsolicited messages of any kind, including cold outreach, purchased lists, or scraped contact data" |
| Brevo | 300/day | **No.** Anti-spam policy requires prior verifiable opt-in; scraped or acquired lists "strictly prohibited" |
| MailerSend | 500/mo, 100/day (cut from 3,000) | **No.** Same opt-in requirement |
| SendGrid | **None** — free plan retired May 2025 | Moot |
| Amazon SES | **None for new accounts** — the 3,000/mo tier ended for accounts created after July 2025; $200 AWS credit instead, then $0.10/1,000 | Permitted in principle, but a new SES account starts in sandbox and getting production access for cold outreach is not a review you will pass |

So the answer is not "find a cheaper ESP." It is the same answer the paid version
of this document gave: **cold outreach belongs in a real mailbox that you own.**
The only thing that changes is which mailbox, and whether a robot presses send.

**Free mailbox options on a custom domain, honestly compared:**

| Option | Cost | Verdict |
| --- | --- | --- |
| **Zoho Mail Forever Free** — 5 users, 1 custom domain, 5 GB each | $0 | **Recommended.** A genuine mailbox with genuine DKIM. Caveat below |
| Cloudflare Email Routing | $0 | **Receiving only.** It forwards `*@yourdomain` anywhere; it cannot send. Useful as the *inbound* half of the brand domain, useless as the outreach sender |
| Cloudflare Email Routing + Gmail "Send mail as" | $0 | **Do not build on this.** Google is removing "Send mail as" for non-Google addresses in **January 2027**, along with Gmailify and web POP fetching. Notice period opened Q3 2026 and Google says it may block *new* configurations during it. A five-week campaign starting now might outlive it; the setup will not |
| Google Workspace Business Starter | $7/user/mo | The strongest deliverability available, and the thing the free stack is trading away |

**The Zoho caveat, stated plainly:** the Forever Free plan is **web and mobile
app only — no SMTP, no IMAP, no POP**. Nothing external can connect to it. That
single restriction is what removes the sequencer from this stack, because every
sequencing and warm-up tool works by connecting over SMTP/IMAP.

### What "free" actually costs you

| | Paid stack | Free stack |
| --- | --- | --- |
| Ramp scheduling | Automated | Manual — you send them |
| Automated warm-up network | Yes | No |
| Reply detection | Automated | You read the inbox |
| Opt-out handling | Automated | You maintain a suppression list by hand |
| List verification | Bundled (2,000 credits) | Manual MX checks, see §7.7 |
| Time cost | ~0 | **~30–45 min/day at the 40/day ceiling** |

That is the real trade: roughly $46/month for roughly forty minutes a day. Over
the 21-day ramp in section 6 the peak is 40 sends/day and the average is nearer
20, so the honest figure for most days is 20 minutes. It is sustainable for a
five-week campaign run by one person. It would not be sustainable for three
mailboxes or a permanent outbound function.

The absence of automated warm-up is the more consequential loss, and section 6
compensates for it with a slower manual ramp.

---

## 3. Domains: the one thing that cannot be free

**Unavoidable cost: one registered domain, ~$10.44/year.**

There is no legitimate free path to this, and it is worth being exact about why.
SPF, DKIM and DMARC are DNS records. Publishing them requires authority over a
zone, which requires owning a domain. Every "free domain" alternative fails for a
specific reason:

- **`vow-motion.vercel.app`** — on the Public Suffix List, Vercel controls the
  DNS, you cannot publish SPF/DKIM/DMARC under it. This is what you have now and
  it is why authentication is currently impossible.
- **Free subdomain providers** (`js.org`, `eu.org` and similar) — you get a
  subdomain of someone else's zone. Some do delegate NS records, but you are
  building sender reputation on a name you do not control and cannot move, and
  the parent domain's reputation is shared with every other user of it.
- **Freenom-style free TLDs** (`.tk`, `.ml`, `.ga`, `.cf`, `.gq`) — do not use
  these. Registrations are revocable without notice, the registry has a long
  history of seizing names, and mailbox providers filter these TLDs
  aggressively precisely because they are free. A free domain that gets junked
  on arrival costs more than $10.

So: buy the domain. At **Cloudflare Registrar** a `.com` is sold at wholesale
cost — roughly **$10.44/year**, no first-year promo, no renewal jump, WHOIS
privacy included at no charge. Cloudflare does not upsell the registration
because the registrar is a loss-leader for the rest of the platform, which in
this plan you are also using for free.

**How many domains?**

| Configuration | Cost/year | Assessment |
| --- | --- | --- |
| **Two domains** — brand + outreach | **~$20.88** ($1.74/mo) | **Recommended.** Preserves the isolation that is the whole point of section 2 |
| One domain — brand only, outreach on a subdomain | ~$10.44 ($0.87/mo) | The absolute floor. See warning |
| One domain — outreach only, app stays on the dev outbox | ~$10.44 | Only if the product is not sending real guest mail yet |

If ten dollars a year is genuinely the constraint, take the one-domain floor —
but understand what it buys. Subdomain isolation is real but partial: Gmail and
Microsoft evaluate reputation at the sending-domain level, so day-to-day the
subdomains are scored separately, but severe or sustained abuse propagates to the
organizational domain, and DMARC alignment ties them together by design. Cold
outreach is the one activity where you have *deliberately* accepted that some
recipients will mark you as spam. Putting that on a subdomain of the domain your
paying customers' wedding invitations leave from means one bad batch can reach
them. The second $10.44 is the cheapest insurance in this entire document — it is
less than one month of the stack it replaces.

`vowmotion.com` is taken. Candidates, at Cloudflare at-cost rather than the
Vercel prices quoted previously:

| Domain | Available | ~Cloudflare/yr | Notes |
| --- | --- | --- | --- |
| `vowmotion.ca` | Yes | ~$12 (CIRA wholesale) | Best brand fit; requires meeting CIRA's Canadian Presence Requirement |
| `vow-motion.com` | Yes | ~$10.44 | Hyphens are a mild spam signal in sender domains |
| `getvowmotion.com` | Yes | ~$10.44 | Good outreach-domain candidate |
| `vowmotionhq.com` | Yes | ~$10.44 | Good outreach-domain candidate |

Availability was checked 8 September 2026 and should be re-checked at purchase.
Buying through Cloudflare Registrar rather than Vercel also puts the DNS on
Cloudflare, which is what Email Routing in section 4 requires.

---

## 4. DNS records

All DNS is managed at **Cloudflare — free plan**, which has no record limit, no
query limit that matters at this scale, and is a prerequisite for Email Routing.
Values marked **generated** cannot be written in advance — the provider mints the
key and shows you the exact string in its dashboard.

### 4a. Cold-outreach domain — `vowmotionhq.com` with Zoho Mail Free

| Type | Name / Host | Value | Priority | TTL |
| --- | --- | --- | --- | --- |
| MX | `@` | `mx.zoho.com` | 10 | Auto |
| MX | `@` | `mx2.zoho.com` | 20 | Auto |
| MX | `@` | `mx3.zoho.com` | 50 | Auto |
| TXT | `@` | **generated** — Zoho domain-verification string (`zoho-verification=…`), shown during setup | — | Auto |
| TXT | `@` | `v=spf1 include:zoho.com ~all` | — | Auto |
| TXT | `zmail._domainkey` | **generated** — Zoho Admin → Domains → your domain → Email Configuration → DKIM → *Add selector* `zmail`, 2048-bit | — | Auto |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@vowmotionhq.com; fo=1; adkim=s; aspf=s` | — | Auto |

Notes:

- Zoho verifies domain ownership first (TXT or CNAME), then MX, then DKIM. Do
  them in that order; the DKIM panel is not reachable until the domain verifies.
- Delete every other MX record on the domain, including any parking record the
  registrar adds. Cloudflare Registrar does not add one, which is a small mercy.
- **Set the Cloudflare proxy to DNS-only (grey cloud) for every mail record.**
  Orange-clouding an MX or a mail-related record breaks it. Cloudflare will not
  proxy MX or TXT anyway, but people do reach for it on the `mail` A record.
- SPF uses `~all` (softfail), not `-all`, until DMARC reports come back clean.
  There must be exactly **one** SPF TXT record on the domain — two is a permanent
  failure, not a merge. If Zoho's setup wizard offers to add SPF and one already
  exists, merge the `include:` into the existing record instead.
- DKIM must be generated in Zoho Admin **and then switched on** after the record
  resolves. Generating the key without enabling the selector leaves you unsigned,
  which is the most common silent failure here.
- Start DMARC at `p=none`. After two weeks of clean aggregate reports showing all
  mail passing SPF and DKIM alignment, move to
  `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@vowmotionhq.com; fo=1; adkim=s; aspf=s`.
  Do not start at `p=reject`; a misconfiguration silently destroys the campaign.
- DMARC aggregate reports arrive as gzipped XML attachments. There are free
  parsers, but at this volume opening two a week by hand is fine.

### 4b. Brand domain — `vowmotion.ca` with Resend Free

Apex and `www` point at Vercel for the website. For the app's transactional mail,
add a domain in Resend as `send.vowmotion.ca` (a subdomain, not the apex) and
publish what its dashboard returns:

| Type | Name / Host | Value | Priority | TTL |
| --- | --- | --- | --- | --- |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (region shown in the Resend dashboard) | 10 | Auto |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — | Auto |
| TXT | `resend._domainkey.send` | **generated** — copy exactly from the Resend dashboard | — | Auto |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@vowmotion.ca; fo=1; adkim=s; aspf=s` | — | Auto |

Notes:

- The `send` subdomain must have no other MX record on it.
- Publish the DKIM value byte-for-byte. A registrar that auto-appends the domain
  to the host name is the usual cause of a stuck "pending" state — enter
  `resend._domainkey.send`, not `resend._domainkey.send.vowmotion.ca`. Cloudflare
  does append the zone, so type the short form and check what it renders.
- Choose the Resend region closest to the app's Vercel region (`iad1` →
  `us-east-1`).
- Update `EMAIL_FROM` in the Vercel project environment to
  `Vow Motion <invitations@send.vowmotion.ca>` once verified.

### 4c. Receiving mail on the brand domain — free

Zoho's free plan hosts **one** domain, and it is spent on the outreach domain.
For `hello@vowmotion.ca` and the `dmarc@` address the DMARC records point at,
use **Cloudflare Email Routing** on the brand domain: unlimited forwarding
addresses to any destination inbox, free, and it publishes its own MX and SPF
records for you.

Two things to get right:

- Email Routing's MX records go on the **apex** (`vowmotion.ca`). Resend's MX
  goes on **`send`**. They do not collide, but do not let one wizard delete the
  other's records.
- Email Routing adds `v=spf1 include:_spf.mx.cloudflare.net ~all` to the apex.
  The apex SPF and the `send` SPF are separate records on separate names; that is
  correct and not a duplicate.
- Forwarding only. You will read this mail in whatever inbox you forward to, and
  replies will come from that inbox's address unless you configure send-as —
  which, per section 2, is the thing Google is retiring in January 2027. For a
  reply-to address on the brand domain, the durable free answer is to route it to
  the Zoho mailbox on the outreach domain and accept that replies come from
  there, or to spend the $1/user/month noted in section 5.

### 4d. Verifying the records (PowerShell)

```powershell
nslookup -type=MX  vowmotionhq.com
nslookup -type=TXT vowmotionhq.com
nslookup -type=TXT zmail._domainkey.vowmotionhq.com
nslookup -type=TXT _dmarc.vowmotionhq.com
```

Then send one message to a Gmail address you control and use **Show original**.
All three of `SPF`, `DKIM` and `DMARC` must read `PASS`. Do not send anything else
until they do. This step is not optional and it is not made less important by the
stack being free — an unauthenticated free mailbox is worse than the university
account you are leaving.

---

## 5. Cost

### The whole stack

| Item | Choice | Cost |
| --- | --- | --- |
| **Brand domain** | Cloudflare Registrar, at-cost | **~$10.44/yr** |
| **Outreach domain** | Cloudflare Registrar, at-cost | **~$10.44/yr** |
| DNS for both | Cloudflare Free | $0 |
| App transactional mail | Resend Free — 3,000/mo, 100/day, 1 domain, webhooks | $0 |
| Outreach mailbox | Zoho Mail Forever Free — 5 users, 1 domain, 5 GB | $0 |
| Inbound on brand domain | Cloudflare Email Routing | $0 |
| Sequencer | None — sent by hand from the Zoho web client | $0 |
| Warm-up | None — manual, per section 6 | $0 |
| List verification | Manual MX check, per section 7 | $0 |
| **Unavoidable cost** | **Two registered domains** | **~$20.88/yr — about $1.74/month** |

Nothing else in this document costs money. The floor if you take one domain
instead of two is **~$10.44/yr**, with the caveat in section 3.

For comparison, the previous version of this plan was ~$28 up front plus
~$48/month — about **$604 in year one**. This is **~$21 in year one**, a saving
of roughly $583, paid for in time rather than money.

### If you later want the time back

In rough order of value per dollar, none of which is needed to start:

| Upgrade | Cost | What it buys |
| --- | --- | --- |
| Zoho Mail Lite | **$1/user/mo** ($12/yr) | Unlocks SMTP/IMAP on the outreach mailbox. This is the gate: with it, a sequencer or warm-up tool can connect at all. Without it nothing external can |
| A sequencer with a real free tier | $0 after the above | Mailmeteor's free plan sends 50/day forever and covers the 40/day ceiling — but it is Gmail-and-Sheets native, so it needs a Google mailbox, not Zoho. Verify tool-to-mailbox compatibility before committing |
| Google Workspace Business Starter | $7/user/mo | The deliverability upgrade rather than the convenience one. Recipients are overwhelmingly Gmail and Workspace, and Google-to-Google is the strongest path available. This is the single upgrade that would most improve inbox placement |
| Smartlead Base | $32–39/mo | Automated ramp, warm-up network, reply detection, and 2,000 verification credits. Buy this only if outbound becomes a permanent function rather than a five-week campaign |

Do not buy any of them before the ramp in section 6 reaches steady state. If the
free stack lands in the inbox, the paid stack buys you convenience, not
deliverability; if the free stack lands in Junk, spending money will not fix a
content or list problem.

---

## 6. Warm-up calendar

Two rules underneath the numbers. A newly registered domain should age roughly two
weeks with DNS live before it sends anything cold — registration date is itself a
filter input. And volume should never rise more than about 20% in a day; abrupt
jumps are read as compromise or list-blasting.

Dates assume the domain is registered Wednesday 9 September 2026. Weekends are
excluded — they do nothing for reputation and depress reply rates.

**The calendar is unchanged from the paid plan, but phase 0 is.** There is no
automated warm-up network on the free stack, so the aging period has to be filled
with real correspondence instead. This is the one place where free is meaningfully
worse, and it is worth over-investing in: a mailbox that has genuinely exchanged
mail with real humans before its first cold send is what warm-up tools are
imitating in the first place.

### Phase 0 — aging and manual warm-up (9–23 Sept, 15 days)

| Date | Action | Cold sends |
| --- | --- | --- |
| Wed 9 Sept | Buy both domains at Cloudflare Registrar. Publish all DNS from section 4 | 0 |
| Thu 10 Sept | Create the Zoho Mail free organisation on the outreach domain. Verify the domain, then generate and enable the `zmail` DKIM selector. Verify SPF/DKIM/DMARC all PASS in a Gmail test | 0 |
| Fri 11 Sept | Set a real profile photo and a signature carrying the physical address from §7.1. Send and reply to ~10 genuine personal messages from the new address | 0 |
| Mon 14 Sept | Manual warm-up begins: 5–8 real messages a day to people who will actually reply — your own other accounts do not count for much, but friends, suppliers, and the Mount Royal address do | 0 |
| 15–23 Sept | Continue 5–10 genuine exchanges daily, ramping to ~15/day by the 23rd. **Reply to the replies** — a two-way thread is worth several one-way sends. Read the first DMARC aggregate reports | 0 |

Manual warm-up does not stop when phase 1 begins. Keep a few real conversations
running alongside the cold sends for the whole campaign; the ratio of
replied-to-threads to cold sends is a signal, and it is the only warm-up you
have.

### Phase 1 — first cold sends (24 Sept – 2 Oct)

| Date | Day | Cold sends | Cumulative |
| --- | --- | --- | --- |
| Thu 24 Sept | 1 | 5 | 5 |
| Fri 25 Sept | 2 | 5 | 10 |
| Mon 28 Sept | 3 | 8 | 18 |
| Tue 29 Sept | 4 | 8 | 26 |
| Wed 30 Sept | 5 | 10 | 36 |
| Thu 1 Oct | 6 | 10 | 46 |
| Fri 2 Oct | 7 | 12 | 58 |

### Phase 2 — building (5–16 Oct)

| Date | Day | Cold sends | Cumulative |
| --- | --- | --- | --- |
| Mon 5 Oct | 8 | 15 | 73 |
| Tue 6 Oct | 9 | 15 | 88 |
| Wed 7 Oct | 10 | 18 | 106 |
| Thu 8 Oct | 11 | 18 | 124 |
| Fri 9 Oct | 12 | 20 | 144 |
| Mon 12 Oct | — | **0** — Thanksgiving | 144 |
| Tue 13 Oct | 13 | 22 | 166 |
| Wed 14 Oct | 14 | 25 | 191 |
| Thu 15 Oct | 15 | 25 | 216 |
| Fri 16 Oct | 16 | 28 | 244 |

### Phase 3 — approaching production (19–23 Oct)

| Date | Day | Cold sends | Cumulative |
| --- | --- | --- | --- |
| Mon 19 Oct | 17 | 30 | 274 |
| Tue 20 Oct | 18 | 32 | 306 |
| Wed 21 Oct | 19 | 35 | 341 |
| Thu 22 Oct | 20 | 38 | 379 |
| Fri 23 Oct | 21 | 40 | 419 |

### Steady state — from 26 October

**40 cold emails per day, per mailbox, maximum.** That is the ceiling, not a
starting point to grow from. Adding volume means adding a mailbox and running it
through this same 21-day ramp, not raising the number on an existing one.

On the free stack there is a second ceiling to respect: Zoho's free plan has its
own outbound rate limits, and sending 40 near-identical messages in a tight burst
from a web client is both against the spirit of those limits and a worse pattern
than spreading them out. Send in two or three sittings across the working day
rather than one block. The Forever Free plan does allow up to five users on the
one domain, so a second mailbox costs nothing if you ever need it — but run it
through the full 21-day ramp before it sends anything cold.

The ~300 contacts already emailed are a separate matter: they were contacted from
`mtroyal.ca` and many never saw the message. Treat them as a re-approach after the
new domain reaches steady state, with different copy that does not pretend the
first message never happened, and drop the 10 bounced addresses and the STOP
permanently.

### Abort conditions

Stop the ramp, hold volume flat for a week, and diagnose if any of these appear:

- Bounce rate above 2% on any day
- Spam complaint rate at or above 0.1% (Google's stated ceiling is 0.3%; treat 0.1% as the line)
- Reply rate falling below ~1% over a full week
- A seed message landing in Junk at Gmail or Outlook

Run a seed test — send to one address each at Gmail, Outlook and a Workspace
domain — at day 1, day 7, day 14 and day 21.

---

## 7. Content fixes for this campaign

Read from `artifacts/outreach-batch5-messages-2026-09-08.json`, all 50 messages.

**What is already right.** Plain text, no HTML, no images, no attachments — so
image/text ratio is a non-issue and should stay that way. Exactly one link per
message, unshortened, shown as the bare URL rather than disguised anchor text.
Around 919 characters, which is a sensible length. No tracking pixel. Genuine
per-recipient personalisation in the `hook` field. No classic trigger vocabulary
("free", "guarantee", "act now", "click here" all absent). Do not let a sequencer
re-add open tracking or link-wrapping through a shared tracking domain — both
undo most of this.

**What needs to change.**

1. **Missing physical mailing address — required, currently absent.**
   CASL requires every commercial electronic message to identify the sender and
   include a mailing address valid for at least 60 days after sending. There is no
   address in any of the 50 messages. It is both a compliance gap and a bulk-mail
   signal that Gmail actively looks for. Add to the signature:

   ```
   Aldo Ortiz — Vow Motion
   <street address, Calgary, AB, postal code>
   ```

   Use your own address, a Canada Post PO box, or a Calgary virtual-office
   mailbox. This is the one field in this document I cannot fill in for you.

2. **Unsubscribe is not a real mechanism.** "If you'd prefer no further emails
   from me, just let me know" asks the recipient to compose a reply. CASL requires
   an unsubscribe that can be readily performed, through a link or an email
   address, honoured within 10 business days and valid for 60 days. Replace with a
   working link.

   On the free stack there is no sequencer to set the `List-Unsubscribe` and
   `List-Unsubscribe-Post` headers (RFC 8058), and the Zoho web client will not
   add custom headers either. That is acceptable: the headers are a legitimacy
   signal rather than an obligation at this volume, and CASL is satisfied by a
   working unsubscribe *link* in the body. Use the same mechanism the product
   uses — section 8c builds a stateless unsubscribe route — and point the
   outreach link at it too, or at a plain `mailto:` with a subject line you
   actually monitor. What is **not** acceptable is the current "just let me know",
   which requires the recipient to compose a reply.

   Maintain the suppression list by hand: one text file, every opt-out added the
   day it arrives, checked before every batch. This is the manual chore most
   likely to be skipped and the one with the worst consequences if it is.

3. **The link points at `vow-motion.vercel.app`.** Covered in section 1. Once
   `vowmotion.ca` is live and serving the site, the link becomes
   `https://vowmotion.ca/planners` — which also matches
   `docs/PLANNER-OUTREACH.md`, where the stated goal is the planner page rather
   than the couple demo. Keep it at one link.

4. **All 50 subjects share one template.** Every subject is
   `A guest invitation idea for <Company>` — 50 near-identical subject lines
   arriving from one sender in one day is a bulk fingerprint. Write three or four
   genuinely different subjects and rotate them.

5. **All 50 bodies share one skeleton.** The merge fields differ; the sentences
   between them are byte-identical across all 50. Write three variants that differ
   in structure, not just wording, and rotate. Vary the length too.

6. **"part of the small team building Vow Motion".** There is no team —
   `docs/PLANNER-OUTREACH.md` is explicit that no planner uses this and no wedding
   has run through it. It is also a well-worn cold-email tell. "I'm Aldo. I build
   Vow Motion." is truer and reads better.

7. **Verify every address before sending.** 10 of 278 bounced (3.6%). There is
   no bundled verification on the free stack, but most of that rate is reachable
   for nothing:

   - **Check the MX record of every recipient domain.** A domain with no MX
     cannot receive mail at all, and dead or parked company domains are the
     largest single category of hard bounce on a scraped planner list. This is a
     one-line loop over the list and it costs nothing.
   - **Drop role addresses** — `info@`, `contact@`, `hello@`, `admin@`. They
     bounce more, convert less, and complain more.
   - **Drop anything with a typo'd public domain** (`gmial.com`, `hotmial.com`).
   - **Re-check the 10 known bounces** and remove them permanently, along with
     the one STOP.

   Free verifier tiers exist but are small and generally require handing over the
   list; the MX check catches most of what they would. Target under 2% before the
   first send, and treat any single day above 2% as an abort condition per the
   list above.

8. **Keep it plain text.** `docs/PLANNER-OUTREACH.md` proposes a version with two
   inline screenshots. Do not use that for cold sends on a new domain — inline
   images shift the image/text ratio and add remote-content fetches, both of which
   cost you at exactly the moment you have no reputation to spend. Reintroduce
   images only in replies, or in follow-ups to people who already engaged.

---

## 8. Production email handling inside the product

Everything above is about the outreach campaign. This section is about Lane A —
the mail the app itself sends to real wedding guests. It is a separate
workstream and it is currently a production-readiness gap.

### 8a. What exists today

- `src/lib/providers.ts` → `deliver()` makes one HTTP call to Resend (or
  AgentMail) and returns `{ status, provider_id }`. It already passes
  `Idempotency-Key: <deliveryId>`, which is the right primitive to build on.
- `src/lib/messages.ts` → `sendMessage()` writes a row into `deliveries` per
  guest, calls `deliver()`, and stores `sent` or `failed`.
- `migrations/001_initial.sql` → `deliveries(id, wedding_id, message_id,
  guest_id, status, provider_id, error, created_at)`.
- `migrations/002_operations.sql` → `webhook_events(id, provider, created_at)`,
  currently used only by Stripe for replay protection.
- `.env.example` already declares `RESEND_WEBHOOK_SECRET`, but nothing reads it
  and `src/app/api/webhooks/` contains only `stripe/`.
- `guests.consent` is a boolean, and `messagingAudience()` in
  `src/lib/messaging-audience.ts` requires `consent === true` before any guest
  receives email or SMS. Opt-in is genuinely enforced. That is the strongest
  part of the current design and should not change.

The gap is everything after the API call returns 200. `sent` in this codebase
means "Resend accepted the request", not "the guest received it" — and nothing
ever revises that value.

### 8b. Delivery and bounce callbacks

Resend reports the rest of the lifecycle over webhooks, signed via Svix.

Add `src/app/api/webhooks/resend/route.ts`, modelled on the Stripe route:

1. Read the raw body with `await req.text()` before parsing — the signature is
   over the exact bytes.
2. Read `svix-id`, `svix-timestamp`, `svix-signature`.
3. Reject if `|now − svix-timestamp| > 300s`, matching the Stripe route's
   tolerance.
4. Compute `HMAC-SHA256(base64decode(secret after "whsec_"),
   "<svix-id>.<svix-timestamp>.<raw body>")`, base64-encode it, and compare with
   `timingSafeEqual` against each space-separated `v1,`-prefixed value in
   `svix-signature`. Any one match is valid.
5. Insert `svix-id` into `webhook_events` with provider `resend`,
   `ON CONFLICT DO NOTHING RETURNING id`, and return early if nothing was
   inserted. This is the same replay guard Stripe already uses, and it matters
   more here: Svix retries a failed endpoint at 5s, 5m, 30m, 2h, 5h, 10h and 10h
   — eight attempts over roughly 27 hours — and disables the endpoint entirely
   after five days of total failure.
6. Match `data.email_id` against `deliveries.provider_id` and update. Every
   email event payload carries `email_id`, so one lookup covers all of them.

Event-to-status mapping. Subscribe to these and ignore the rest:

| Resend event | New `deliveries.status` | Retry? | Other effect |
| --- | --- | --- | --- |
| `email.sent` | `sent` | — | Confirms acceptance; no action needed |
| `email.delivered` | `delivered` | No | Terminal success |
| `email.bounced` | `bounced` | **No** | Store `data.bounce.type` and `data.bounce.subType` in `bounce_type`; clear `guests.consent` only when `type` is `Permanent` |
| `email.complained` | `complained` | **Never** | Clear `guests.consent` immediately and permanently |
| `email.delivery_delayed` | leave unchanged | **No** | Resend is still retrying internally. Re-sending here double-delivers |
| `email.failed` | `failed` | Yes, if transient | Store the provider reason in `deliveries.error` |
| `email.suppressed` | `suppressed` | No | The address is on the team suppression list |
| `suppression.added` | — | — | Mirror onto the guest row so the studio UI can explain the silence |
| `suppression.removed` | — | — | Clear the mirrored flag |

Two behaviours worth knowing before you build the UI on top of this:

- Resend suppresses hard-bounced and complained addresses **automatically and
  team-wide**, across every domain and subdomain. Once a guest's address is
  suppressed, later sends to that guest are silently skipped. Without mirroring
  `suppression.added` locally, the studio will show "sent" and the couple will
  never learn why the guest heard nothing.
- **Gmail and Google Workspace do not return complaint feedback.** Most wedding
  guests are on Gmail, so `email.complained` will fire far less often than the
  real complaint rate. Do not treat a zero complaint count as evidence of health.

Schema to support it — `migrations/012_delivery_events.sql`. (`011` was taken by
`011_message_delivery.sql`, which added `messages.updated_at` for the stalled-send
reclaim described in 8d; migrations run in filename order, so the number must be
unique and must sort after it.)

```sql
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS bounce_type text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS suppressed_reason text;
CREATE INDEX IF NOT EXISTS deliveries_provider_idx ON deliveries(provider_id);
CREATE INDEX IF NOT EXISTS deliveries_retry_idx ON deliveries(next_attempt_at);
```

`provider_id` is the Resend email id and is the only join key the webhook
carries, so it needs that index before this runs at any volume.

Configure the endpoint at `https://<domain>/api/webhooks/resend` in the Resend
dashboard and put the generated `whsec_…` value in `RESEND_WEBHOOK_SECRET` —
the variable that is already declared and unused.

### 8c. Unsubscribe workflow

`guests.consent` is set at RSVP and there is no way for a guest to withdraw it
from inside an email. The only exit is replying and asking a human, which is the
same defect section 7 flags in the outreach template — and here it applies to
mail sent on a paying customer's behalf, which makes it their compliance
problem as well as yours.

**Token.** Stateless HMAC, no new table and no expiry to manage:
`token = base64url(HMAC-SHA256(UNSUBSCRIBE_SECRET, guest_id))`, giving
`https://<domain>/u/<guest_id>/<token>`. Verify with `timingSafeEqual`. CASL
requires the mechanism to stay valid at least 60 days after sending; a stateless
token satisfies that with no expiry bookkeeping. Add `UNSUBSCRIBE_SECRET` to
`.env.example` alongside `CRON_SECRET`.

**Route.** `src/app/api/u/[guest]/[token]/route.ts`, handling both verbs:

- `GET` → a confirmation page, in the guest's `language` (the column exists, and
  the guest UI is already English/Spanish).
- `POST` → set `consent=false`, `unsubscribed_at=now()`, return `200` with an
  empty body. RFC 8058 requires the POST to work without any further interaction.

**Headers.** Resend's `/emails` endpoint takes a `headers` object, so add to the
`deliver()` payload for the email channel:

```json
"headers": {
  "List-Unsubscribe": "<https://vowmotion.ca/u/9f2c.../k3Xa...>",
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
}
```

The angle brackets around the URL are part of the header value (RFC 2369) — the
outer quotes are JSON, the inner `<…>` must be sent literally.

Both headers, or neither — a `List-Unsubscribe` without the `-Post` companion
does not give you one-click. The one-click mandate formally binds senders above
5,000/day, far above this product's volume, but the headers are read as a
legitimacy signal at any volume and cost nothing.

**Scope.** Apply this to wedding updates and announcements. Do **not** put an
unsubscribe header on the invitation itself, on RSVP confirmations, or on account
verification mail — those are transactional, the guest asked for them, and an
unsubscribe link on a wedding invitation is a bad experience as well as being
unnecessary.

**Honour it everywhere.** `messagingAudience()` already filters on
`consent === true`, so a withdrawal takes effect on the next send with no further
work. Also treat `unsubscribed_at` as permanent: a couple re-importing a
spreadsheet must not resurrect consent. Add a guard on the guest import path.
CASL allows 10 business days to process a withdrawal; RFC 8058 expects 48 hours.
This design is immediate, which satisfies both.

### 8d. Retries

Three distinct failure modes are currently collapsed into one `failed` row.

**A permanent rejection must not be retried.** A hard bounce, an invalid
address, an unverified domain, a suppressed recipient — retrying any of these
harms reputation and never succeeds.

**A transient failure must be retried.** Right now `deliver()` throws
`HttpError(502, …)` for every non-`ok` response, discarding the provider's
status code, and `sendMessage()` catches it, writes
`error='Provider rejected request'`, and never revisits the row. A Resend 429 or
a 500 loses that guest's invitation permanently, with nothing in the UI
distinguishing it from a bad address.

The fix, in order:

1. Have `deliver()` surface the upstream status code and body instead of
   flattening everything to 502.
2. Classify in `sendMessage()`: `429` and `5xx` (and `AbortSignal.timeout`
   firing) → retryable; `4xx` other than 429 → permanent.
3. On a retryable failure set `status='failed'`, `attempts=attempts+1`, and
   `next_attempt_at = now() + interval` on a 5m / 30m / 2h schedule. Give up
   after three attempts and leave the row `failed` for the couple to see.
4. Have the worker pick up `status='failed' AND attempts < 3 AND
   next_attempt_at <= now()` alongside the scheduled drafts it already queries.
5. Reuse the existing `deliveries.id` as the `Idempotency-Key`. Resend honours
   an idempotency key for 24 hours, so retries inside that window cannot
   double-send. Beyond 24 hours the protection is gone, which is another reason
   to cap at three attempts over roughly two and a half hours.

**Two bugs this document previously flagged — both now fixed.** Recorded here
because the reasoning is what keeps them fixed.

*Resumed sends double-deliver.* `sendMessage()` used to do
`const deliveryId = id()` and then `INSERT … ON CONFLICT(message_id,guest_id) DO
NOTHING`. When a row already existed the insert was skipped, but `deliveryId` was
still a fresh UUID — so the later `UPDATE … WHERE id=$3` matched nothing, and the
`Idempotency-Key` was new, so Resend treated it as a distinct message and sent
the guest a second copy. `sendMessage()` now selects the existing delivery row
first and reuses its id, so the idempotency key is stable across a resume; and it
builds an `alreadyReached` set from deliveries already in `sent` or `development`
and skips those guests entirely. **The invariant to preserve: the
`Idempotency-Key` handed to `deliver()` must always be `deliveries.id`, and that
row must be created before the provider call, never after.**

*Messages can strand in `processing`.* `sendMessage()` claims the message before
touching a provider, then loops over guests sequentially with a 20-second timeout
each, while the calling route caps at `maxDuration: 60` (`vercel.json`). A wedding
with more than a handful of guests could exhaust the function before the loop
ended, leaving `status='processing'` forever — unclaimable, because the retry path
only looked at `draft`. The claim now also accepts a message that has sat in
`processing` longer than `STALLED_AFTER` (10 minutes), using the
`messages.updated_at` column added in `011_message_delivery.sql`, and
`src/lib/message-state.ts` gives the Studio a "Stopped part-way" state and a
`canRetry()` predicate so the couple has a way back. Reclaiming is safe because
of the fix above: already-sent guests are skipped by row, and any genuine repeat
is caught by the idempotency key.

**Cron frequency — and the Vercel Hobby ceiling.** `vercel.json` ran
`/api/worker` on `0 6 * * *`: once a day at 06:00 UTC, which is 23:00 or midnight
in Calgary. A message a couple scheduled for Saturday evening did not leave until
the small hours of Sunday.

The obvious fix is `*/15 * * * *`, and **it cannot be deployed on this account.**
The project is on a Hobby plan, and Hobby is limited to cron jobs that run *once
per day* — a more frequent expression fails at deploy time with "Hobby accounts
are limited to daily cron jobs." Hobby also gives only per-hour scheduling
precision, so a job set for 13:00 fires somewhere between 13:00 and 13:59.

So the schedule is now `0 13 * * *` — still daily, but 07:00 in Calgary rather
than midnight, which is at least a defensible hour for wedding mail to leave.
**The retry backoff in this section is therefore dormant on the current plan.**
The 5m/30m/2h ladder is correct and it is exercised whenever the worker actually
runs — which, today, means once a day or when a couple presses "Try again" in the
Studio. It is not wrong, it is under-driven.

Three ways to give it a real tick, cheapest first:

| Option | Cost | Result |
| --- | --- | --- |
| **An external pinger** — a GitHub Actions scheduled workflow, or a free tier at cron-job.org, calling `POST /api/worker` with the `CRON_SECRET` bearer token | **$0** | Full 15-minute cadence. The endpoint is already authenticated and idempotent, so nothing in the app has to change. GitHub Actions' scheduled runs are best-effort and can lag under load, which at this cadence does not matter |
| Leave it daily | $0 | Correct, just slow. Acceptable while the product has no paying weddings on it |
| Vercel Pro | $20/mo | Per-minute intervals and per-minute precision. Not worth it for this alone |

The external pinger is the option that fits the rest of this document, and it is
the one to take before the first real wedding sends anything.

One more free-tier interaction to know about: Resend's free plan allows 100
emails/day, so a couple with 150 guests will see the last 50 fail with a 429 and
sit in the retry queue. On a daily tick they go out the following day. With the
pinger, they go out as soon as the quota rolls over.

### 8e. What to show the couple

Once delivery states are real, the studio messages view should distinguish
`delivered`, `bounced` (with the address, so it can be corrected and resent),
`complained` / `unsubscribed` (permanently excluded, no resend offered), and
`failed` with retries pending. Today all of these appear as `sent`, and a guest
who never got their invitation is invisible until they mention it at the wedding.

---

## 9. Order of operations

**Step 0, and the only one that does not wait on anything: send nothing further
from `mtroyal.ca`.** It is free, it is immediate, and every day it slips is
another day of commercial mail on a university domain.

### The outreach track — needs ~$20.88

1. Approve **~$20.88** for two domains (or ~$10.44 for one, with the section 3
   caveat). There is no monthly cost to approve.
2. Confirm you meet CIRA's Canadian Presence Requirement, or substitute a `.com`.
3. Buy both domains at **Cloudflare Registrar**, which puts DNS on Cloudflare —
   a prerequisite for step 6.
4. Publish the DNS records in section 4. Confirm SPF, DKIM and DMARC all PASS in
   a Gmail **Show original** before anything else happens.
5. Create the **Zoho Mail Forever Free** organisation on the outreach domain;
   verify the domain, then generate and *enable* the `zmail` DKIM selector.
6. Turn on **Cloudflare Email Routing** on the brand domain for `hello@` and the
   `dmarc@` address the DMARC records point at.
7. Point `vowmotion.ca` at the Vercel project; update `APP_URL` and `EMAIL_FROM`.
8. Start **manual** warm-up per section 6 phase 0. Do not send cold mail for 14
   days. There is no automated warm-up on this stack and skipping the manual
   version is the most likely way for this plan to fail.
9. Rewrite the template per section 7 — physical address, working unsubscribe,
   new link target, three subject and body variants, corrected "team" line.
10. Re-verify the remaining contact list with the free MX check in §7.7.
11. Begin the ramp on 24 September at five emails, sent by hand.
12. Move DMARC to `p=quarantine` after two weeks of clean reports.
13. Only *after* steady state, revisit the upgrade table in section 5 — and only
    if the constraint has turned out to be your time rather than deliverability.

### The product track — needs nothing

Independent of everything above except step 4, and free in every sense:

1. ~~Change the cron in `vercel.json`~~ — **partly done**, now `0 13 * * *`
   (07:00 Calgary instead of midnight). `*/15` is rejected by the Hobby plan; set
   up the free external pinger in 8d to get a real tick.
2. ~~Fix the two `sendMessage()` bugs~~ — **done**; see 8d for the invariants
   that keep them fixed.
3. Run `migrations/012_delivery_events.sql`. *(Note the number: `011` was taken.)*
4. Build `/api/webhooks/resend`, register the endpoint, fill
   `RESEND_WEBHOOK_SECRET`. Webhooks are included on the Resend free tier.
   *(Registering the endpoint needs the verified domain from step 4 above; the
   code does not.)*
5. Classify errors in `deliver()` and add the retry schedule.
6. Build the unsubscribe route and add the two headers to update mail only.
7. Surface the real delivery states in the studio messages view.

---

## Sources

Free-tier limits and terms, checked 9 September 2026:

- [Resend Acceptable Use Policy](https://resend.com/legal/acceptable-use) (cold outreach prohibited; complaint <0.08%, bounce <4%) · [Resend pricing](https://resend.com/pricing) · [Resend free tier limits 2026](https://automationatlas.io/answers/resend-free-tier-explained-2026/) · [Resend pricing breakdown 2026](https://nuntly.com/resend-pricing)
- [Zoho Mail free custom-domain plan](https://www.zoho.com/mail/custom-domain-email.html) · [Zoho Mail rates, limits and policies](https://www.zoho.com/mail/help/adminconsole/rates-and-limits.html) · [Zoho free plan limitations 2026 — no SMTP/IMAP/POP](https://mailbux.com/blog/email-comparisons/zoho-mail-free-plan-limitations-alternative)
- [Cloudflare Email Routing — free custom-domain email 2026](https://mecanik.dev/en/posts/cloudflare-email-routing-free-custom-domain-email/) · [Cloudflare low-cost domain names](https://www.cloudflare.com/application-services/solutions/low-cost-domain-names/) · [Cloudflare Registrar at-cost pricing 2026](https://www.stackscored.com/pricing/domain-registrars/cloudflare-registrar/) · [Registrar price comparison 2026](https://domaindetails.com/registrars/cheapest)
- **Gmail is removing "Send mail as" for third-party addresses in January 2027**: [Google ends Gmail Send-as for third-party accounts](https://proton.me/blog/gmail-ends-send-as-third-party) · [Android Authority](https://www.androidauthority.com/gmail-killing-third-party-send-as-feature-3694659/) · [What outbound teams must move before January 2027](https://leadhaste.com/blog/gmail-send-as-third-party-accounts-2027)
- [Brevo anti-spam policy](https://www.brevo.com/legal/antispampolicy/) and [terms of use](https://www.brevo.com/legal/termsofuse/) (purchased/scraped lists prohibited) · [Is Brevo cold email allowed in 2026](https://puzzleinbox.com/blog/brevo-cold-email-allowed-tos-2026/)
- [SendGrid free plan retired, May 2025](https://www.twilio.com/en-us/changelog/sendgrid-free-plan) · [MailerSend plans and limits](https://www.mailersend.com/help/plans-features-and-limits) (free tier cut to 500/mo)
- [Amazon SES pricing plans — free tier changes](https://aws.amazon.com/blogs/messaging-and-targeting/introducing-amazon-simple-email-service-ses-pricing-plans/) · [Is the SES free tier still 62,000 emails?](https://www.saaspricepulse.com/blog/amazon-ses-pricing-per-1000-emails-2026)
- [Mailmeteor free plan — 50/day](https://qualtir.com/blog/gmail-mail-merge-free-tool) · [Free cold email tools with real free plans 2026](https://automailer.io/best-free-cold-email-tools)

Retained from the original costing, for the upgrade table in section 5:

- [Google Workspace pricing](https://workspace.google.com/pricing) · [Smartlead pricing 2026](https://www.emailchaser.com/learn/smartlead-pricing) · [Zoho Mail pricing 2026](https://toolradar.com/tools/zoho-mail/pricing)

Product-side implementation:

- [Resend webhook event types](https://resend.com/docs/dashboard/webhooks/event-types) · [Resend email suppressions](https://resend.com/docs/dashboard/emails/email-suppressions) · [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) · [Resend unsubscribe in transactional email](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails)
- [Resend webhooks: events, verification and retries](https://www.getfluxly.com/blog/resend-webhooks) · [Svix retry schedule](https://docs.svix.com/retries)
- [RFC 8058 one-click unsubscribe](https://www.rfc-editor.org/rfc/rfc8058.html) · [SendGrid List-Unsubscribe guidance](https://www.twilio.com/docs/sendgrid/ui/sending-email/list-unsubscribe)
- [Resend domain DNS records](https://www.getfluxly.com/blog/resend-domain-verification-dns) · [Resend DKIM selector](https://www.getfluxly.com/blog/resend-dkim-selector)

Deliverability and warm-up:

- [Bulk sender rules for Google, Yahoo, Microsoft and Apple 2026](https://powerdmarc.com/bulk-email-sender-requirements/) · [2026 bulk sender requirements checklist](https://redsift.com/guides/bulk-email-sender-requirements)
- [Email warmup timelines 2026](https://leadhaste.com/blog/email-warmup-timeline-and-schedule) · [Warming a new domain in 3-5 weeks](https://www.lemlist.com/blog/warm-up-email-account)

Domain availability was checked 8 September 2026 via the Vercel domains API; the
prices above are Cloudflare at-cost figures and should be confirmed at purchase.
