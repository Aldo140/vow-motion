# Launch status

Reviewed 7 September 2026. Vow Motion is a persistent, functional launch preview with a tested core flow. It has not been deployed or verified as a fully operated public service. The [master brief](MASTER-BRIEF.md) is the product target, not a statement that every requested feature is complete.

## Implemented

| Area | Current behavior |
| --- | --- |
| Product and design | Responsive marketing experience, Studio, invitation reveal, reduced-motion handling, self-hosted type, and generated demo imagery. Six selectable worlds; Riviera, Maison, and Notte have dedicated imagery and seeded demo weddings. Heritage, Modernist, and Garden reuse those assets and the shared guest layout. |
| Accounts and workspaces | Registration, password login, seven-day sessions, email verification before collaborator access, separate visitor demos, multiple weddings, and partner/planner/viewer access controls. |
| Guest list | Persistent households and guests, contact details, language, tags, consent, plus-one records, CSV import/export, filtering, and personal links. Invitation tokens can expire and be revoked. |
| Events and RSVP | Timezone-aware events, household-based private access, per-person/event responses, meals, dietary details, configurable questions, RSVP deadlines, capacity checks, and saved responses. |
| Guest experience | Account-free household invitations, English/Spanish interface, password-protected or public story, event details, travel/registry links, contact correction, QR wedding pass, and calendar download. |
| Wedding operations | Seating with drag/drop and accessible table menus, capacity checks, travel/registry records, photo upload/approval/deletion, collaborator roles, and an activity log. |
| Messaging | Consent-filtered drafts and audiences, email/SMS adapters, visible development outbox, and an authenticated worker for scheduled messages. Demo sends always stay local. |
| Billing | Optional hosted one-time Checkout and a signed Stripe webhook that deduplicates events and records paid plans. Missing payment configuration returns an explicit unavailable response. |

## Validation evidence

Verified locally on 7 September 2026:

- TypeScript and ESLint checks passed.
- Five unit tests passed.
- Eight Playwright tests passed in the final combined run (30.0 seconds), covering the core workflow, verification, privacy, photos, capacity, and keyboard behavior.
- Optimized Next.js production build passed.
- Production-dependency audit reported zero known vulnerabilities.
- Fifteen page/viewport combinations across marketing, Studio, and three guest worlds at 390×844, 768×1024, and 1440×1000 had no document overflow or JavaScript page errors.
- The review’s hidden-sidebar focus, unnamed modal, and Maison mobile heading overlap findings were fixed and covered by a regression test.

These are local development checks, not certification of a deployment or untested integrations.

See [README validation instructions](../README.md#validation) to reproduce the checks. External email/SMS sending, payment settlement, DNS/SSL provisioning, restore procedures, load handling, and a complete accessibility/browser matrix have not been verified in this environment.

## Remaining production work

| Area | Limitation and required work |
| --- | --- |
| Infrastructure | Local PGlite and filesystem uploads support one persistent application process. Remote PostgreSQL is implemented but requires deployment verification; Private Vercel Blob storage is implemented for serverless or multiple instances; live integration verification is still required. Migration startup now uses a transaction-scoped advisory lock to coordinate replicas. |
| Email and SMS | Live delivery requires credentials and approved senders. No delivery/bounce callback processing, unsubscribe link workflow, automatic retries, or recovery of interrupted processing is implemented. The UI's status does not establish recipient delivery or an email open. |
| Scheduled jobs | A scheduler must call the worker with `CRON_SECRET`; there is no autonomous scheduler or durable queue service. |
| Payments | Live Checkout and webhook tests remain. Recorded plans do not yet enforce feature entitlements, quotas, refunds, or subscription lifecycle behavior. |
| Domains | The Studio stores a hostname and pending status. DNS ownership checks, host routing, SSL provisioning, and Vercel API automation are not implemented. |
| Account operations | No password reset, MFA, ownership transfer, or self-service account deletion. Operator deletion is documented in the README; demo/session/challenge retention cleanup is not scheduled. |
| Full product brief | No advanced invitation composition editor, printed stationery integration, native wallet pass, check-in scanning, complete planner administration, referral rewards, or comprehensive operational analytics. QR codes link back to the invitation. |
| RSVP design | Household and person questions support simple attendance conditions; household answers are copied into per-person/event response records. Arbitrary branching, event-specific meal configuration, and a separate household-answer model are not implemented. |
| Language and creative depth | English/Spanish interface support does not translate user-authored content automatically. Six worlds share structural components; the three secondary worlds need distinct imagery and deeper direction to meet the full bespoke-world brief. |
| Operational readiness | Publish operator-specific privacy information and retention rules; configure backups, restore exercises, monitoring, incident handling, abuse controls, and production capacity checks. No compliance certification or operational SLA is claimed. |

## Review artifacts

Desktop/mobile screenshots are saved in [artifacts/](../artifacts/). [RESEARCH.md](RESEARCH.md) records the primary-source product research; [ASSETS.md](ASSETS.md) records fictional image provenance. Build and test commands are in the [README](../README.md). No production URL is claimed by this document.
