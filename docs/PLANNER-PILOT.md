# Planner pilot implementation

The Studio now has a Wedding setup route that walks through world selection, wedding details, events, guest import, and household preview. Review states persist per wedding. Publishing from this flow requires all five reviews and owner/partner access; planners prepare the wedding for the couple to publish.

CSV import retains column mapping, household grouping and export. The review now shows household assignments, trims mapped values, flags repeated email addresses within a file, and requires an explicit decision about possible duplicates. Uploading an invalid replacement file clears the earlier preview.

Guest preview allows household selection and shows included and excluded event counts. It creates a separate, one-hour preview token. Preview tokens use the normal server-side household visibility rules, reject all guest mutations, and do not record invitation opens.

Your experience includes a coordinated four-piece identity preview and saved monogram, typography, curated accent, image focal point and optional planner attribution. These settings flow into guest invitations, RSVP, itinerary and wedding passes. Colours have separate light/dark variants. Each world retains its existing voice, ornaments and distinct image.

The overview action list identifies pending households, missing per-event meal choices, missing answers to required travel-related RSVP questions, and unanswered guest questions. Required travel questions are identified by travel/arrival/flight/hotel/accommodation/shuttle/transport in their English label; no travel requirement is inferred if no such question exists.

Guests can leave a private question in their invitation. The planning team answers under Guest questions; the response appears only for that household. Answers are not emailed automatically.

Pilot feedback can be recorded from any Studio screen, with open/in-progress/resolved states under Pilot feedback. Notes are saved for that wedding’s collaborators. This is an internal issue list, not an automatic support email or external ticket integration.

Migration `008_planner_pilot.sql` adds preview tokens, pilot feedback and private guest requests. The existing migration runner applies it on database startup.

Direct planning-platform integrations, reusable event-template libraries and printable stationery were deferred ideas, not part of this first pilot implementation. Existing planner document exports remain available.

Validation: `npm run check` and `npx playwright test tests/e2e/planner-pilot.spec.ts`. If Playwright’s bundled browser is unavailable, set `PLAYWRIGHT_CHANNEL=msedge` or `chrome` to use an installed browser.
