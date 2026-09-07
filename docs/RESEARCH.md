# Product research · 6 September 2026

Primary sources reviewed during implementation:
- https://withjoy.com/guest-list/ — households, per-event RSVP, guest-specific access and filtered exports.
- https://www.paperlesspost.com/features — invitations as a delivery/tracking workflow, not just a card.
- https://paperlesspost.zendesk.com/hc/en-us/articles/207620646-Tracking-Responses-Where-are-my-RSVPs — distinguishes recipient delivery/open tracking from shareable links.
- https://nextjs.org/blog — stable Next.js 16 release family. Installed package versions verified against npm: Next 16.3.4, React 19.2.8. Exact dependency versions recorded in package-lock.json.

Decisions: one authoritative guest table; normalized households; opaque personal links; server-filtered private events; conversational per-person/event responses; no fake email-open precision; one-time wedding payment architecture; no invented prices or customer testimonials.

Design references are principles, not cloned layouts: a boutique hospitality photograph, printed stationery, a fashion masthead, and a quiet production studio. Original image generation supplies fictional venue imagery; no actual venue photograph is represented as documentary evidence.
