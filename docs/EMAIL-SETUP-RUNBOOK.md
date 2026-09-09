# Email setup — painfully detailed runbook

> **PARKED — not the current plan.** This is the eventual upgrade (own domain,
> professional `aldo@vowmotion.ca` sender, highest deliverability). It needs a
> ~$13 domain purchase and dashboard work you decided is too much for right now.
> Current sending runs on the free path in
> [OUTREACH-SENDING.md](OUTREACH-SENDING.md). Come back to this doc when you want
> the upgrade — nothing here expires.

You do the parts that need a credit card, a login, or a click in a dashboard I
cannot see. **I do everything else.** This document spells out your parts to the
individual click.

**Total you spend: ~1 hour of clicking spread over 2 days, plus ~$13 once for a
domain.** After that it is 10 minutes a day of paste-and-send for a few weeks,
with me writing every email.

---

## The whole plan on one screen

| # | Sitting | Who | Time | Cost |
| --- | --- | --- | --- | --- |
| 1 | Buy the domain (Cloudflare) | **You** | 15 min | ~$13/yr |
| 2 | Start the Zoho mailbox, copy 1 value | **You** | 15 min | $0 |
| 3 | Paste all DNS records into Cloudflare | **You** | 20 min | $0 |
| 4 | *(next day)* finish Zoho DKIM + run the Gmail test | **You** | 15 min | $0 |
| 5 | Point the website at the domain, update the app | **Me** | — | $0 |
| 6 | 2 weeks of ordinary email from the new mailbox | **You** (5 min/day) | — | $0 |
| 7 | Send outreach: I write each batch, you paste + send | **You** (10–40 min/day) | — | $0 |

If you buy a name other than `vowmotion.ca`, that is fine — **tell me the name
and everywhere this file says `vowmotion.ca`, use yours.** I also update it
throughout the codebase in one pass.

---

## SITTING 1 — buy the domain

### 1.1 Make a Cloudflare account (skip if you have one)

1. Open a browser. Go to: **https://dash.cloudflare.com/sign-up**
2. Type your email and a new password. Click **Sign Up**.
3. Open your email inbox. Find the email from Cloudflare ("Verify your email
   address"). Click the button in it. You are now logged in.

### 1.2 Buy `vowmotion.ca`

1. In the Cloudflare dashboard, look at the **left sidebar**.
2. Click **Domain Registration**, then **Register Domains**.
   (If you cannot find it, paste this into the address bar:
   **https://dash.cloudflare.com/?to=/:account/domains/register** )
3. In the search box, type exactly: `vowmotion.ca` — press **Enter**.
4. A results list appears. Look for the row **`vowmotion.ca`**:
   - If it shows a price (around **$12–13**) and a checkbox or **Purchase**
     button → good, continue.
   - If it says **Unavailable / Taken** → search `getvowmotion.com` instead and
     use that everywhere from now on. (`.com` also skips step 1.3 below.)
5. Tick the checkbox for **that one domain only**. Do not add others. Click
   **Proceed to checkout** / **Continue**.

### 1.3 Fill in checkout

1. **Contact / registrant details:** your real full name, home address, email,
   phone number. ICANN requires this. Cloudflare keeps it out of public WHOIS
   for free — you do not need to buy a privacy add-on.
2. **`.ca` only — "Canadian Presence Requirement":** a dropdown appears. Pick the
   option that is true for you:
   - Canadian citizen → **"Canadian Citizen"**
   - Permanent resident → **"Permanent Resident"**
   - Neither → **stop, go back, buy `getvowmotion.com`** instead (no requirement).
   - A student at a Canadian university usually qualifies under citizen or PR —
     pick the honest one.
3. **Payment:** enter your card. The total is about **$13 CAD for one year**.
4. Leave **auto-renew ON** (so the domain does not lapse). Decline every other
   add-on.
5. Click **Complete Purchase**.

### 1.4 Confirm it worked

1. Wait for the success screen. `.com` is instant; `.ca` can take a few minutes
   up to an hour — you will get a confirmation email.
2. In the left sidebar click **Websites** (or **Account Home**).
3. You should see **`vowmotion.ca`** in the list. Click it.
4. In its left menu click **DNS**, then **Records**.
5. You will see a short, nearly-empty list of DNS records. **This is what you
   want.** It means Cloudflare is hosting the domain's DNS and you can add
   records to it. Keep this tab; you need it in Sitting 3.

### 1.5 Tell me

Send me one line: **"domain bought: vowmotion.ca"** (or your actual name).

I will immediately update the codebase, this runbook, and the outreach copy to
your domain, and prepare the Sitting 5 changes.

---

## SITTING 2 — start the Zoho mailbox and copy one value

Zoho Mail's **Forever Free** plan gives you a real mailbox (`aldo@vowmotion.ca`)
that you use through a website, like Gmail. No cost, no API key, no app to
install.

### 2.1 Start signup on the free plan

1. New browser tab: **https://www.zoho.com/mail/zohomail-pricing.html**
2. Scroll **all the way down**, past the paid plans (Mail Lite, Mail Premium),
   to a section titled **"Forever Free Plan"** (5 users, 5 GB/user, 1 domain).
3. Under **Forever Free Plan**, click **Sign Up Now** / **Get Started**.
   - If the free plan is genuinely not visible, the paid signup page has a
     "Try the Forever Free plan" link near the bottom — use that.

### 2.2 Choose "I already own a domain"

1. Zoho asks whether you want to **buy a new domain** or **use one you already
   own**. Choose **"Sign up with a domain you already own"**.
2. Enter:
   - **Domain:** `vowmotion.ca`
   - **Your name**, a **password** for this Zoho account (write it down), your
     **phone number**
3. Click **Sign Up** / **Proceed**.
4. **Phone check:** type the code Zoho texts you.

### 2.3 Create your mailbox address

1. When it asks for the first account / "super admin" mailbox, set it to:
   **`aldo@vowmotion.ca`**
2. Continue. You now land in the **Zoho setup wizard**, on a step called
   **"Domain Verification"** or **"Verify your domain"**.

### 2.4 Copy the one value I need

1. On the verification step, Zoho shows methods: **TXT**, CNAME, HTML file.
   Click the **TXT** tab.
2. It displays a **Value / Destination** that looks like:
   `zoho-verification=zb99999999.zmverify.zoho.com`
3. **Select that whole string and copy it.** Leave this Zoho tab open.
4. Also note the **Host / Name** it shows next to it — it is usually `@` or blank
   (meaning the domain root). Zoho sometimes shows it as
   `zb99999999` for the host with `zmverify.zoho.com` as the value — if so, copy
   **both** the host and the value exactly as shown.

### 2.5 Tell me

Send me: **"zoho TXT — host: `<what it shows>` value: `<what it shows>`"**

I will hand you back the exact rows to type in Sitting 3, merged with everything
else, so you enter all DNS in one pass.

---

## SITTING 3 — paste all DNS records into Cloudflare

Do this once, entering everything together. Go back to the Cloudflare tab from
Sitting 1.4 (**Websites → vowmotion.ca → DNS → Records**).

For **each** row in the table I give you (I will fill the two "generated" values
from what you sent in Sittings 2 and 4):

1. Click the blue **Add record** button.
2. Set **Type** from the dropdown (TXT, MX, etc.).
3. Type the **Name** exactly as given. `@` means the domain root — Cloudflare
   accepts `@`.
4. Paste the **Content / Value** exactly. No extra spaces, no quotes you add
   yourself.
5. For **MX** rows, also set **Priority** to the number given.
6. **Proxy status:** for MX and TXT there is no cloud toggle — ignore it. If you
   ever see an orange cloud on a mail record, click it once to make it grey
   ("DNS only").
7. Leave **TTL** on **Auto**.
8. Click **Save**.

### The records (I will confirm the two "GENERATED — from you" values)

| # | Type | Name | Content / Value | Priority |
| --- | --- | --- | --- | --- |
| 1 | TXT | `@` | *GENERATED — the `zoho-verification=…` string from Sitting 2.4* | — |
| 2 | MX | `@` | `mx.zoho.com` | `10` |
| 3 | MX | `@` | `mx2.zoho.com` | `20` |
| 4 | MX | `@` | `mx3.zoho.com` | `50` |
| 5 | TXT | `@` | `v=spf1 include:zoho.com ~all` | — |
| 6 | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:aldo@vowmotion.ca; fo=1` | — |
| 7 | TXT | `zmail._domainkey` | *GENERATED — the DKIM key from Sitting 4.2* | — |

**Important about row 5 (SPF):** there must be exactly **one** record on `@`
starting with `v=spf1`. If Cloudflare already shows one (some registrars add
it), do **not** add a second — send me what the existing one says and I will
give you the single merged line to replace it with.

Row 7 you will add during Sitting 4 (the DKIM value does not exist yet). Rows
1–6 you can do now.

### After saving rows 1–6

1. Go back to the **Zoho tab**. On the verification step, click
   **Verify** / **Verify TXT Record**.
   - If it fails, wait 10 minutes and click again — DNS takes a little time.
2. Once it says verified, Zoho's wizard moves to **"Add users"** or **"Configure
   email delivery (MX)"**. If it offers to check MX, let it — rows 2–4 should
   pass. Click through **"Create account" / "Proceed"** for `aldo@vowmotion.ca`.
3. When the wizard reaches a step about **DKIM** or offers **"Skip / configure
   later"**, you can skip to finish the wizard — you will set DKIM in Sitting 4.
4. You should now be able to open **https://mail.zoho.com** and see an inbox for
   `aldo@vowmotion.ca`. Send yourself a test email from it to any address to
   confirm it sends.

### Tell me

Send: **"DNS rows 1–6 in, Zoho domain verified, mailbox opens."**

---

## SITTING 4 — DKIM + the test that proves Gmail will trust it *(next day is fine)*

DKIM is the digital signature Gmail checks hardest. Two parts: create the key in
Zoho, publish it in Cloudflare, then **switch it on** (the step everyone forgets).

### 4.1 Create the DKIM key in Zoho

1. Go to **https://mailadmin.zoho.com** (the admin console, not the mailbox).
2. Left menu: **Domains** → click **`vowmotion.ca`**.
3. Find **Email Configuration** → **DKIM** (sometimes under a "Config" or
   "Authentication" tab). Click it.
4. Click **Add** / **Add Selector**.
5. Set:
   - **Selector:** `zmail`
   - **Key size / length:** `2048` if offered a choice
6. Click **Save**. Zoho now shows a long block of text starting
   `v=DKIM1; k=rsa; p=MIIB...` — this is the public key.
7. **Copy the entire value.** It is long (hundreds of characters). Get all of it.

### 4.2 Tell me the DKIM value

Send: **"DKIM value: `<paste the whole v=DKIM1; ... string>`"**

I will confirm exactly what to put in Cloudflare row 7 (usually it is the value
verbatim, but Cloudflare occasionally needs it split — I will tell you which).

### 4.3 Publish it in Cloudflare

1. Cloudflare → **vowmotion.ca → DNS → Records → Add record**.
2. **Type:** TXT
3. **Name:** `zmail._domainkey`
   (type exactly that — Cloudflare adds `.vowmotion.ca` itself. Do **not** type
   `zmail._domainkey.vowmotion.ca`.)
4. **Content:** the DKIM value (what I confirm in 4.2).
5. **Save.**

### 4.4 Switch DKIM ON in Zoho

1. Back in **https://mailadmin.zoho.com** → **Domains → vowmotion.ca → DKIM**.
2. Wait until it shows the selector as **found / verified** (click refresh; may
   take 10–30 min).
3. Click the **toggle / "Enable"** next to the `zmail` selector so it is
   **active**. **This step is mandatory** — without it every email you send is
   unsigned and Gmail will not trust it.

### 4.5 The test — do not send outreach until this passes

1. From **https://mail.zoho.com**, logged in as `aldo@vowmotion.ca`, compose a
   plain email to a **Gmail address you control** (make a throwaway Gmail if
   needed). Subject "test", body "test". Send.
2. Open Gmail, open that email.
3. Click the **⋮** (three dots, top-right of the message) → **Show original**.
4. A new tab opens with a summary box at the top. You must see:

   | | |
   | --- | --- |
   | **SPF** | **PASS** |
   | **DKIM** | **PASS** |
   | **DMARC** | **PASS** |

5. If all three say PASS → **you are done with setup.** Tell me: **"all three
   PASS."**
6. If any says FAIL or "not signed" → copy the whole Show-original text into a
   message to me and I will tell you the one thing to fix.

---

## SITTING 5 — my part (you do nothing)

The moment you send me **"domain bought"**, I:

- Add `vowmotion.ca` + `www.vowmotion.ca` to the Vercel project.
- Give you the 1–2 web DNS records to add in Cloudflare (A + CNAME — I will paste
  them in the same painfully-detailed style).
- Set `APP_URL=https://vowmotion.ca` in Vercel and redeploy.
- Change every `vow-motion.vercel.app` link in the outreach copy and docs to
  `https://vowmotion.ca`.
- Keep the app's own email (invitations/RSVP) switched off until you have a real
  wedding — it needs a separate setup we do later, and nothing is sending now.

---

## SITTING 6 — warm-up (5 minutes a day for 2 weeks)

A brand-new domain that immediately blasts 50 cold emails goes to Junk no matter
how perfect the DNS is. It has to look like a mailbox a human actually uses
first.

From `aldo@vowmotion.ca` at **mail.zoho.com**, each weekday:

- **Week 1:** send ~5 genuine emails to people who will reply — friends,
  suppliers, your Mount Royal address, yourself at other accounts. Real
  subjects, real content. **Reply to their replies.**
- **Week 2:** ~10–15 a day, same idea. A back-and-forth thread counts for much
  more than a one-way send.

Set a profile photo and this signature in Zoho (**Settings → Mail → Signature**):

```
Aldo Ortiz
Vow Motion
<your street address, Calgary, AB  postal code>
```

I need that street address for the outreach footer too — **send it to me.** It
can be your home, a Canada Post PO box, or a Calgary virtual mailbox. CASL law
requires a real postal address in commercial email and Gmail checks for one.

---

## SITTING 7 — sending outreach (I write it, you paste it)

After the 2-week warm-up:

1. Tell me "ready to send, day 1" — I generate that day's emails as finished
   blocks: for each planner, the exact **To**, **Subject**, and **Body** (with
   the footer already in it), rotating the wording so no two look alike.
2. For each block, in **mail.zoho.com**: click **Compose**, paste the To,
   paste the Subject, paste the Body, click **Send**. ~20 seconds each.
3. Volume ramp (weekdays only): **day 1–5: 5–8/day. Week 2: 10–15. Week 3:
   18–25. Week 4+: 30, max 40.** Never more than 40 in a day from one mailbox.
4. Before I generate each batch I check it against
   [`outreach/suppression.txt`](../outreach/suppression.txt) and drop dead
   domains. You just paste and send.

Zoho's free plan has no automation hook, so the paste-and-send is the one thing
that cannot be removed without paying. Everything upstream of it, I do.

---

## If something goes wrong

| Symptom | What to send me |
| --- | --- |
| Cloudflare won't sell `vowmotion.ca` | "taken" — I'll give you the next name |
| Can't find Zoho's free plan | a screenshot of the pricing page |
| Zoho "Verify" keeps failing | wait 30 min; if still failing, a screenshot of your Cloudflare DNS list |
| Show original shows DKIM fail | the full Show-original text |
| Any step's wording doesn't match what you see | a screenshot — dashboards change their layout and I'll re-map the step |
