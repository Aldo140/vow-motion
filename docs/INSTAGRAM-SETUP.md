# Instagram publishing — setup runbook

This connects the Vow Motion Instagram account so posts scheduled in
`/admin/content` publish themselves through the worker. The code is already
deployed; it stays dormant until the two environment variables at the end exist.

**Cost: $0.** **Your time: ~40 minutes of clicks, once.** Everything after that —
drafting, scheduling, publishing, keeping the token alive — is automatic.

The one thing only you can do is this whole document: it needs your Facebook
login, your Instagram login, and an OAuth consent screen. I can't drive any of
it. Meta also rearranges these screens often, so follow the on-screen labels
where they differ from the exact wording here.

---

## What you're building

| Piece | Detail |
| --- | --- |
| Account type | Instagram **Business** or **Creator** (personal accounts can't use the API) |
| API | "Instagram API with Instagram login" (no Facebook Page required) |
| App | A Meta developer app, left in **Development mode** — that's enough to publish to your *own* connected account |
| Secrets | `INSTAGRAM_ACCOUNT_ID` + `INSTAGRAM_ACCESS_TOKEN` in Vercel |

---

## SITTING 1 — make the account a Business or Creator account

1. Open the **Instagram app** on your phone, logged in as the Vow Motion account
   (make one first at instagram.com if it doesn't exist — pick a handle like
   `vowmotion` or `vowmotion.app`).
2. **Profile → menu (☰) → Settings and privacy → Account type and tools →
   Switch to professional account.**
3. Choose **Business** (or Creator — either works). Pick a category like
   "Software" or "Product/service". You can skip connecting a Facebook Page when
   asked — the API path we're using doesn't need one.
4. Done. The profile now says "Business" under the bio in settings.

---

## SITTING 2 — create the Meta app

1. On a computer, go to **https://developers.facebook.com** and log in with your
   personal Facebook account. Accept the developer terms if prompted.
2. Top right: **My Apps → Create App.**
3. **"What do you want your app to do?"** → tick **"Other"** → **Next**.
   (If it asks for an app *type* instead, choose **Business**.)
4. **App name:** `Vow Motion Social` · **App contact email:** your email ·
   **Business portfolio:** leave as "I don't want to connect a business
   portfolio" (or your own if you have one). **Create app** → re-enter your
   password.
5. You land on the app dashboard.

---

## SITTING 3 — add Instagram and connect the account

1. On the app dashboard, find **"Add products to your app"** (or left sidebar
   **Add product**). Locate **Instagram** → **Set up**.
2. In the Instagram section, open **"API setup with Instagram login"** (it may be
   the only option, or under a "Set up" button).
3. Under **"1. Generate access tokens"**, click **Add account** (or **Generate
   token**).
4. A popup opens **instagram.com** asking you to log in and authorize. Log in as
   the **Vow Motion** account and approve the permissions
   (`instagram_business_basic`, `instagram_business_content_publish`).
5. Back on the Meta page, the account now appears with a **token** next to it and
   an **Instagram user ID** (a long number, e.g. `17841400000000000`).
   - **Copy the Instagram user ID** → this is `INSTAGRAM_ACCOUNT_ID`.
   - **Copy the access token** → this is `INSTAGRAM_ACCESS_TOKEN`. Treat it like
     a password.
6. Note whether the page labels the token **long-lived** / shows an expiry ~60
   days out. It usually does. If it looks short-lived, do Sitting 3b.

### Sitting 3b — only if the token is short-lived

1. App dashboard → **App settings → Basic**. Copy the **App secret** (click
   "Show").
2. In a terminal, run (replace the two values):

   ```
   curl -s "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=YOUR_SHORT_TOKEN"
   ```

3. The response is `{"access_token":"IGA...","token_type":"bearer","expires_in":5183944}`.
   That `access_token` is the long-lived one — use it as `INSTAGRAM_ACCESS_TOKEN`.

---

## SITTING 4 — verify the token works

In a terminal (replace `TOKEN`):

```
curl -s "https://graph.instagram.com/v21.0/me?fields=id,username,account_type&access_token=TOKEN"
```

You want:

```json
{"id":"17841400000000000","username":"vowmotion","account_type":"BUSINESS"}
```

- `account_type` must be `BUSINESS` or `CREATOR`. If it's `PERSONAL`, redo
  Sitting 1 and regenerate the token.
- The `id` here must match the `INSTAGRAM_ACCOUNT_ID` you copied.

---

## SITTING 5 — put the secrets in Vercel

1. **vercel.com → project `vow-motion` → Settings → Environment Variables.**
2. Add two, both scoped to **Production**:
   - `INSTAGRAM_ACCOUNT_ID` = the Instagram user ID
   - `INSTAGRAM_ACCESS_TOKEN` = the long-lived token
3. **Deployments → latest → ⋯ → Redeploy.**
4. When it's READY: open **`https://vow-motion.vercel.app/admin/content`**. The
   "not connected" banner is gone. Schedule a post; the worker publishes it on
   its next run.

---

## How it runs after setup

- **Scheduling:** every post has a "publish at" time. The daily worker
  (`/api/worker`, 07:00 Calgary) publishes any post whose time has passed. For
  finer timing, set up the free external pinger from
  [EMAIL-DELIVERABILITY.md](EMAIL-DELIVERABILITY.md) §8d — the same one — and
  posts go out within 15 minutes of their scheduled time.
- **Token upkeep:** the worker refreshes the 60-day token about two weeks before
  it expires and stores the new one in the database. As long as the worker runs
  at least once a fortnight, the token never lapses. If it ever does, redo
  Sittings 3–5 with a fresh token.
- **Limits:** Instagram allows 25 API posts per 24 hours. A caption is capped at
  2,200 characters. Images are auto-resized to 1440px JPEG; Reels must be an
  MP4/MOV you supply (3–90s, vertical 9:16 works best).
- **Failures:** a post that fails to publish retries up to 3 times, then lands in
  "Needs attention" on `/admin/content` with the error from Instagram.

---

## Checklist

- [ ] Vow Motion IG account is Business or Creator
- [ ] Meta app created, Instagram product added
- [ ] Account connected, `INSTAGRAM_ACCOUNT_ID` + long-lived token copied
- [ ] `curl .../me` shows `account_type: BUSINESS`
- [ ] Both env vars set in Vercel Production, redeployed
- [ ] `/admin/content` shows no "not connected" banner
- [ ] First post scheduled and published
