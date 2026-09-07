# Vow Motion

[Live application](https://vow-motion.vercel.app) · [Release status](docs/LAUNCH-STATUS.md)

A wedding planning application that connects a private guest list to invitations, event access, RSVP, travel details, seating, and guest photos. The Studio manages the wedding; a personal household link opens the guest experience without a guest account.

This repository is a working launch preview. See [Launch status](docs/LAUNCH-STATUS.md) for implemented behavior, validation evidence, and the work required before public operation. The full product brief is in [docs/MASTER-BRIEF.md](docs/MASTER-BRIEF.md); visual direction and asset provenance are in [DESIGN.md](DESIGN.md) and [docs/ASSETS.md](docs/ASSETS.md).

## Run locally

Use Node.js 22.12 or newer in the 22.x line, or another version supported by the installed dependencies. The workspace runtime is Node 22.23.2. Vitest 5 has a higher Node minimum than Next.js itself.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). On the sign-in page, **Try a private demo** creates an isolated demo account with three fictional weddings. Demo guest and RSVP changes are saved to the local database. Demo messages never contact email or SMS providers, even when provider credentials are present. A browser with no existing session cookie creates a separate demo; there is no automatic demo expiry or cleanup job.

If this workspace's Node installation is absent from your shell path, first run:

```bash
export PATH="/home/mrotiz14/.local/share/vow-runtime/bin:$PATH"
```

For a new wedding, use **Begin your story** and create an account. Personal invitation links are bearer credentials: anyone holding one can access and update that household's guest information. Replace a link in the Studio to revoke earlier links for that household.

## Configuration and persistence

Copy [.env.example](.env.example) and configure only the services you intend to use. Keep secrets server-side and outside version control.

| Variable | Behavior |
| --- | --- |
| `APP_URL` | Canonical origin for invitation links, checkout redirects, and metadata. Use the final HTTPS origin in production. |
| `DATABASE_URL` | PostgreSQL connection string. When empty, the app uses embedded PGlite at `DATA_DIR/postgres`. |
| `DATA_DIR` | Persistent local storage directory; defaults to `./data`. Uploaded photos are stored under `uploads`, even with remote PostgreSQL. |
| `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX_ID` | Enable email using a managed AgentMail inbox; no custom sender domain is required. Resend takes precedence if both providers are configured. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Enable email delivery. The sender must be configured with the email provider. Missing credentials route messages to a development outbox. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Enable SMS delivery. All three values must be configured for actual sending. |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ESSENTIAL`, `STRIPE_PRICE_SIGNATURE`, `STRIPE_PRICE_BESPOKE` | Enable one-time Stripe Checkout for configured prices. No card data is stored by this application. |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe events received at `/api/webhooks/stripe`. |
| `CRON_SECRET` | Required bearer secret for the scheduled message worker. |
| `RESEND_WEBHOOK_SECRET`, `ADMIN_EMAILS`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Reserved configuration boundaries; no email callback handler, admin console, or custom-domain automation currently consumes these values. |

SQL migrations in [migrations/](migrations/) run in filename order on the first database access and are tracked in `schema_migrations`. They require schema-write permissions and the migration files at runtime. There is no separate migration CLI. Bring up a single instance first when applying a new migration; migration startup is not coordinated across replicas.

Embedded PGlite must have one application process accessing its data directory. Stop the development server before starting a production server against the same embedded database. For multiple application instances, use PostgreSQL and implement shared durable upload storage. Database queries and transactions are serialized within each application process; this is a correctness-oriented preview implementation, not a demonstrated high-throughput deployment.

## Architecture

The application uses Next.js 16.3.4 App Router, React 19, TypeScript, PostgreSQL/PGlite, Zod, GSAP, and CSS. Fonts are self-hosted through Fontsource; images are original generated demo assets. Dependency versions are pinned by `package-lock.json`.

| Location | Responsibility |
| --- | --- |
| `src/app/page.tsx`, `src/components/marketing.tsx` | Product presentation and world previews. |
| `src/app/studio/[[...section]]`, `src/components/studio*.tsx` | Authenticated workspace, guest management, events, experience settings, messaging, travel, seating, photos, and collaborators. |
| `src/app/i/[token]`, `src/components/guest-experience.tsx` | Household invitation, permitted events, RSVP, contact updates, wedding pass, calendar, and photos. |
| `src/app/w/[slug]` | Published story and invitation lookup entry point. |
| `src/app/api/[...path]/route.ts` | Validated HTTP operations, guest authorization, exports, uploads, and provider handoff. |
| `src/lib/auth.ts`, `src/lib/data.ts` | Sessions, permissions, rate limiting, and server-filtered household/event data. |
| `src/lib/db.ts`, `migrations/` | Database connection, transactions, and schema evolution. |
| `src/lib/providers.ts`, `src/lib/messages.ts` | Email/SMS adapters, consent-filtered audiences, message processing, and Checkout. |
| `src/app/api/worker`, `src/app/api/webhooks/stripe` | Scheduled message processing and signed, deduplicated Stripe events. |

Households, guests, event access, and event responses are normalized database records. RSVP writes check the invited guest/event set and capacity inside a transaction. Guest payloads exclude owner IDs and internal notes. Passwords use salted scrypt; session and invitation tokens are stored as hashes. Session cookies are HTTP-only, SameSite=Lax, and secure in production. Viewers cannot mutate wedding data; publishing, privacy, team, and domain changes have additional role checks.

Before modifying Next.js code, follow [AGENTS.md](AGENTS.md) and read the relevant guide in `node_modules/next/dist/docs/`. In this installed version, route parameters and cookies are asynchronous, and `next build` does not run ESLint.

## Verification and privacy

Your own account can manage its weddings before email verification. Access through a collaborator email requires verification at `/verify`. Codes expire after ten minutes, are limited to five guesses, and can be consumed only once. In local development without email credentials, a code is shown only to the signed-in account requesting its own verification. Production verification requires the email provider.

Password-protected stories use a separate, hashed one-day session. Changing the wedding password invalidates existing story sessions. An unlocked story does not grant household or event access; those still require a personal invitation. Password hashes are excluded from Studio and wedding-list responses.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The Playwright configuration expects an already-running application at `http://localhost:3000`; it does not start a server. Use a disposable local or staging database because the browser tests create demo weddings and persist mutations.

```bash
npx playwright install chromium
npm run test:e2e
```

Unit tests cover input validation, event timestamps/timezones, CSV and calendar escaping, and password/token primitives. Browser tests exercise the marketing page, private demo, guest creation, invitation/RSVP persistence, mobile overflow, seating, CSV export, tenant isolation, event privacy, token revocation, verified collaborator access, single-use verification codes, password story privacy, photo authorization/moderation, full-event attendee swaps, and keyboard focus behavior. Screenshots are written to `artifacts/`; browser reports are written to `playwright-report/`. These tests do not certify external provider delivery, production PostgreSQL behavior, all browsers, or a full accessibility audit. Current execution results are recorded in [Launch status](docs/LAUNCH-STATUS.md).

## Deploy and operate

Deploy as a Node.js server with persistent storage. This application requires server-side sessions, database access, and filesystem uploads; static export is not supported. A serverless deployment needs changes to uploaded-image storage before it can retain photos reliably.

1. Install locked dependencies, supply production environment variables, and provision PostgreSQL or a persistent single-process PGlite directory.
2. Include `migrations/` and `public/` in the deployed application. Set a writable persistent `DATA_DIR` and back up the database and uploads together.
3. Run `npm run build`, then `npm start` behind HTTPS. The scripts listen on all interfaces; set `PORT` if necessary.
4. Configure verified email/SMS senders and exercise their behavior in a provider test environment. Configure Stripe's webhook endpoint as `https://your-origin/api/webhooks/stripe` and test a paid Checkout event with matching metadata.
5. Schedule authenticated `POST /api/worker` requests. The endpoint processes up to 25 due draft messages per request; merely setting a schedule in the Studio does not run a background process.

Example worker invocation from an environment containing the secrets:

```bash
curl --fail --request POST \
  --header "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/worker"
```

Message statuses represent provider acceptance or local development handling, not confirmed delivery or opens. Failed or interrupted sends need operator review; there is no automated retry/recovery queue. Stripe's signed webhook records a paid plan after payment; plan entitlements and refund/subscription lifecycle handling are not implemented.

Custom domain entries are saved as pending records. Adding one does not provision DNS, SSL, or host-to-wedding routing. A deployment operator must implement and verify that integration before offering domains to customers.

The preview privacy page needs the operating entity, contact details, retention policy, and actual provider disclosures before public launch. Configure monitoring, backup restoration, and resource limits for the environment being operated. See the [current limitations](docs/LAUNCH-STATUS.md) before accepting real guest data.

## Account removal procedure

There is no self-service account deletion screen. An installation operator can remove an account after confirming its identity and the scope of owned weddings. Removing an owner deletes their owned weddings and the associated guest information for all collaborators; it does not transfer ownership.

Use the application's database connection or an authenticated PostgreSQL maintenance session. Resolve the account ID and normalized email first, and record the uploaded filenames associated with its owned weddings before deleting database records. Execute the following parameterized statements in one transaction, with `$1` as the confirmed user ID and `$2` as the confirmed email:

```sql
SELECT p.filename
FROM photos p JOIN weddings w ON w.id = p.wedding_id
WHERE w.owner_id = $1;

DELETE FROM weddings WHERE owner_id = $1;
DELETE FROM collaborators WHERE lower(email) = lower($2);
DELETE FROM referrals WHERE user_id = $1;
DELETE FROM audit_log WHERE actor_id = $1;
DELETE FROM users WHERE id = $1;
```

Foreign-key cascades remove the owned weddings' related data and the user's sessions. After a successful commit, remove only the recorded files from `DATA_DIR/uploads`. These SQL parameters are driver placeholders; do not paste them into a shell as substitutions. Apply the operator's retention policy to backups and external provider records as well. Guest information about this person in weddings they did not own must be handled separately with those hosts.

## Hosted release

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the Vercel/PostgreSQL/private Blob deployment contract, health checks, and remaining operator configuration. Local guest data, secrets, build output, and test screenshots are excluded from Git.

### Managed service release

The hosted release uses Neon for durable data, private Vercel Blob for photos, and a verified AgentMail inbox for email. Password recovery at `/recover` sends a ten-minute, single-use code, limits guesses, and revokes existing sessions after a successful reset.

Hosts can publish updates directly inside private household invitations without email addresses or messaging consent. Future updates become visible when their scheduled time arrives. Vercel invokes the authenticated message worker daily at 06:00 UTC; scheduled email is processed on the next daily run. Provider acceptance is not a guarantee of inbox delivery.

SMS controls are hidden until a complete SMS provider configuration exists. Checkout is hidden when billing is unavailable, and the wedding tools remain usable without a card. Real payment settlement still requires a verified merchant account.
