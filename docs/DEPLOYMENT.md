# Deployment and release

The application targets Node.js 22 on Vercel with hosted PostgreSQL and a private Vercel Blob store. Local development retains embedded PostgreSQL and filesystem photos.

## Required configuration

- `APP_URL`: the final HTTPS origin, used for canonical metadata, calendar links, and checkout returns.
- `DATABASE_URL`: hosted PostgreSQL. The app refuses to use ephemeral database files on Vercel.
- `BLOB_STORE_ID` with Vercel OIDC, or server-only `BLOB_READ_WRITE_TOKEN`: a **private** Blob store.
- Optional live services: Resend and a verified sender for email/account verification; Twilio for SMS; Stripe price IDs and webhook secret for payments. Missing providers do not count as live delivery or paid checkout.

Database migrations are included in the deployment bundle. Startup applies pending migrations in one transaction using a transaction-scoped advisory lock, including through a transaction pooler. PostgreSQL connections use a bounded pool and connection timeout. `/api/health` returns 200 only after the database responds; failure returns 503 without connection details.

Photos are authenticated before retrieval, stored privately, and streamed through the application. Large browser uploads are resized before reaching the hosting gateway. The server independently decodes, resizes, and removes image metadata. Upload records that fail to save trigger storage cleanup.

## Release checks

```bash
npm ci
npm run check
# With a local development server running:
npm run test:e2e
```

Vercel also runs lint and unit tests before each production build. Run the browser suite before merging substantive changes. The test suite uses local demo data; it is not intended to send live messages, process real payments, or mutate real weddings.

After configuring the production database, verify `/api/health`, account creation/login, guest creation, invitation access, RSVP persistence, and private photo upload/read/moderation against the deployed app. Confirm persistence across a redeployment. Do not advertise the deployment as fully operational until these checks pass.

## Remaining operator setup

Email/SMS sender verification, payment account configuration, domain ownership, backup/restore exercises, retention, abuse monitoring, and operator privacy disclosures require production account settings. A worker exists for scheduled messages, but an external scheduler must invoke it with `CRON_SECRET`; no cron is enabled until scheduling and provider readiness are established.

See LAUNCH-STATUS.md for product features that remain outside this release. The deployment work does not claim a formal security review, full accessibility certification, or load-tested capacity.
