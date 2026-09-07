# Refinement review — 7 September 2026

The customer has two jobs: couples need to resolve the next planning decision with confidence; guests need to understand their invitation and respond without learning a tool. This pass focused on those jobs in the existing running application.

## Research behind the priorities

Paperless Post documents audience-targeted, customizable RSVP reminders and event updates ([official help](https://paperlesspost.zendesk.com/hc/en-us/articles/4408189210779-Send-a-RSVP-Reminder-or-Follow-Up-Email-or-to-Guests-or-Recipients)). Its [guest reminder documentation](https://paperlesspost.zendesk.com/hc/en-us/articles/38992736702363-Opt-in-event-reminders-for-guests) also recognizes that guests may open an invitation before they are ready to answer. These support two design choices here: give couples an appropriate starting message and let guests return without repeating the ceremonial opening. This is design inference, not a claim of user testing or measured conversion improvement.

## Implemented review

| Before | After | Why |
| --- | --- | --- |
| Event form required ISO timestamps and UTC offsets | Native date/time controls, venue timezone suggestions, explicit timezone explanation | Couples think in local venue time. |
| UTC calendar day could appear on event date chips | Date chips use the event timezone | A late evening event must retain its local date. |
| Daylight saving conversion was left to the editor | Conversion rejects nonexistent and ambiguous local times with actionable explanations | Silent shifts could put invitations and calendars an hour apart. |
| Message composition started blank | Editable RSVP and travel starters with couple/date/location details | Reduce writing effort while preserving the couple’s voice. |
| Audience reach appeared only on send | Live count and named recipient preview, using consent/contact/status/tag rules | Make targeting reviewable before delivery. |
| Schedule input used the browser timezone | Schedule resolves in the wedding timezone | Destination couples and planners may be elsewhere. |
| Overview primarily showed totals and setup completion | Contextual priorities show pending replies, unseated guests, missing contacts and moderation queue | Give the next visit a useful next action. |
| Sidebar links reloaded the document | Client navigation with current-page semantics; wedding identity keys isolate state | Preserve continuity without mixing wedding state. |
| Every visit repeated the envelope opening | Browser remembers that a household has opened its invitation | First impressions and repeat visits serve different needs. The marker stores no token or guest details. |
| RSVP details lacked an attendance recap | Per-event, per-person summary before saving | Guests can check exactly what they are sending. |
| Declining guests received an invitation to add the celebration to their calendar | Decline-specific acknowledgment without the calendar CTA | Respect the actual answer. |
| Draft restoration only checked array length | Validate authorized guest/event pairs and basic shape; blocked storage does not break editing | Avoid stale drafts crossing invitation changes. |
| Upload failure could repeat earlier files | Preflight the batch, show progress, skip successful files on retry while the dialog remains open, reset after success | Reduce accidental duplicate memories. |
| Travel and registry details could only be added or removed | Edit the original record in place with tenant-scoped validation | Correcting shuttle times or a booking link should not require rebuilding the detail. |
| Mobile guest list required horizontal table scrolling | Each guest has a readable compact record with household, status, meal, and touch-sized actions | Keep decisions and controls visible together. |
| Small mobile form text could trigger browser zoom | 16px mobile form text and 44px key controls | Improve readability and touch use. |

## Practical limits

This is a functional refinement of the local application. It does not establish live-provider delivery, custom-domain activation, production load capacity, or usability outcomes with real wedding guests. See LAUNCH-STATUS.md for the remaining production integrations. Upload retry protection applies within an open dialog; server-side idempotency for lost responses remains a future hardening opportunity. Repeated daylight-saving hours are deliberately rejected rather than silently picking one occurrence.

## Verification completed

- TypeScript, ESLint, and the optimized Next.js production build passed.
- 7 unit tests passed, including timezone round trips and daylight-saving boundaries.
- 11 browser tests passed, including RSVP persistence, tenant privacy, event capacity, verified collaboration, mobile focus, venue-time edits, message targeting, partial photo retry, and travel editing.
- The 26-screen sweep covered all 13 Studio sections at desktop and phone widths: no page overflow, broken images, or JavaScript page errors. Evidence: `artifacts/refinement-screen-audit.json`.
- Screenshots: `artifacts/refined-overview.png`, `artifacts/refined-event-editor.png`, `artifacts/refined-message-mobile.png`, and the desktop/mobile guest, travel, seating, and experience captures.

Repeated local test runs reached the demo-creation rate limit. Test runs now use isolated test source addresses; application rate limits remain enforced.
