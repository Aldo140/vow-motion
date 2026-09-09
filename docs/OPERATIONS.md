# Production operations

This runbook turns the remaining launch checks into repeatable commands. Run it before the first live wedding, after infrastructure changes, and after any incident involving guest data or delivery.

## Release gate

1. Run `npm ci`, `npm run check`, and the Playwright suite.
2. Run `RELEASE_URL=https://your-origin npm run ops:probe` against the deployed release.
3. Run `RELEASE_URL=https://your-origin npm run ops:capacity` first with the defaults, then increase `LOAD_REQUESTS` and `LOAD_CONCURRENCY` only within the hosting provider's permitted test policy.
4. Confirm `/api/health` is monitored externally at least every five minutes. Alert after two consecutive failures.
5. Confirm the worker has run successfully and that scheduled messages, retries, and expired-record cleanup are visible in its JSON result.

The capacity script reads public pages and health only. It does not create accounts, guests, replies, payments, or email. A production write-load test requires a separately authorized staging database and test provider accounts.

## Backup and restore drill

Create a PostgreSQL custom-format backup with `DATABASE_URL` set to the source and `npm run ops:backup`. Store the resulting dump outside the application host with encryption and access logging.

Restore only into an empty drill database:

```powershell
$env:RESTORE_DATABASE_URL = "postgresql://...drill-database..."
$env:RESTORE_CONFIRM = "vow-motion-YYYY-MM-DDTHH-MM-SS.sssZ.dump"
npm run ops:restore -- "artifacts/backups/vow-motion-YYYY-MM-DDTHH-MM-SS.sssZ.dump"
```

Never set `RESTORE_DATABASE_URL` to production. The restore command deliberately ignores `DATABASE_URL` and requires the exact backup filename as confirmation. After restoration, start the app against the drill database and verify `/api/health`, one Studio, one invitation, RSVP records, private-event filtering, and photo metadata. Record the drill date, operator, recovery time, row counts, and result.

Back up daily while live weddings exist. Keep daily copies for 35 days and one monthly copy for 12 months unless the published customer agreement requires a different period. Test a restore every quarter and before a destructive migration.

## Data retention

The authenticated worker deletes expired sessions, expired invitation tokens, expired story sessions, expired rate-limit rows, and verification/reset challenges seven days after expiry. Wedding records, guest replies, photos, messages, delivery evidence, enquiries, and audit history remain until an authorized deletion or the customer retention period is implemented. Do not promise automatic deletion for those records yet.

Unsubscribe, complaint, and hard-bounce suppression must survive imports. Retain the minimum suppression record needed to prevent a future send. Do not re-enable a suppressed guest from the Studio without a new, documented guest opt-in.

## Messaging release gate

Before enabling invitation campaigns, send a test to the wedding owner, then send one controlled household invitation. Confirm its private link resolves to the intended household, the delivery appears in Studio, and a repeated send excludes the successfully sent household. Verify bounced and suppressed addresses move to **Needs attention** and cannot be sent again until a bounced address is corrected.

- Verify the sending domain and set `EMAIL_FROM` to that domain.
- Serve invitation links from the same organizational domain used by `EMAIL_FROM`; mailbox providers treat a different link domain as suspicious. Do not use the `vercel.app` URL in production mail.
- In Resend, disable click and open tracking for transactional invitations. Confirm SPF and DKIM show **Verified**, publish DMARC (begin with `p=none`), and inspect a Gmail test for `spf=pass`, `dkim=pass`, and `dmarc=pass` before increasing volume.
- Configure `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, and a stable `UNSUBSCRIBE_SECRET`.
- Register `/api/webhooks/resend` and confirm signed delivered, bounced, and complained events update a test delivery.
- Call `/api/worker` with its bearer secret and confirm scheduled sends and retries.
- Send to controlled Gmail and Outlook accounts; verify SPF, DKIM, DMARC, unsubscribe, and reply behavior.
- Keep cold outreach on separate infrastructure. Product messaging is only for guests who opted in.

## Payments and domains

Before enabling Checkout, configure Stripe prices and the signed webhook. Complete a test payment, a duplicate webhook replay, and a failed payment. The database permits one current subscription record per wedding. Product feature enforcement is not active, so payment must remain an optional managed-service path until entitlements are defined.

Custom-domain records can be stored in Studio, but production activation still requires DNS ownership, Vercel project credentials, routing, and certificate verification. Do not mark a domain active from a manual database edit.

## Incident response

1. Stop the affected path: disable its provider credential or scheduled worker while preserving evidence.
2. Record the start time, affected weddings, symptoms, recent deploy, and operator.
3. Protect guests first: revoke exposed invitation tokens, suppress unsafe sends, and rotate a compromised secret. Rotating `UNSUBSCRIBE_SECRET` invalidates old links, so do it only if that secret is compromised.
4. Restore service through rollback or a tested fix. Avoid direct production data edits without a backup and written query.
5. Verify with the release probe and the affected customer journey.
6. Notify affected customers with known facts, impact, and next update time. Never claim delivery or recovery without evidence.
7. Write a short incident review with the trigger, detection gap, fix, and one prevention owner.

## Operator record

For each release, retain the commit, deployment URL, migration result, probe output, capacity output, backup identifier, worker result, and messaging/payment checks that apply. A successful deployment alone is not a production-readiness result.
