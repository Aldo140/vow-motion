# Planner pilot implementation

The Studio now has a Wedding setup route that walks through world selection, wedding details, events, guest import, and household preview. Review states persist per wedding. Publishing from this flow requires all five reviews and owner/partner access; planners prepare the wedding for the couple to publish.

Setup now shows a five-chapter progress trail, contextual guidance and a small milestone acknowledgement for newly completed chapters. Saving the experience or essentials also completes that review and advances, with keyboard focus returned to the chapter heading. Completed reviews persist when returning later. The guided essentials screen leaves domain, billing and publishing controls in Settings and preserves existing privacy settings.

Timezone choices are searchable by city/country or IANA name across registration, wedding settings and event editing, with an explicit device-timezone shortcut. RSVP deadlines offer four-, six- and eight-week shortcuts using calendar-date arithmetic. Event titles and dress codes offer editable suggestions, new event capacity starts from the guest count, and the wedding location pre-fills the address. An empty guest list includes a downloadable sample spreadsheet with household guidance.

Guest RSVP confirmation acknowledges both acceptance and decline warmly, confirms that the reply was saved, and explains that plans can be updated. Acceptance adds a brief visual flourish; decline uses a quiet acknowledgement. Motion respects reduced-motion preferences. Milestones reflect actual completed reviews; there are no streak penalties, fake urgency or recurring engagement requirements.

CSV import retains column mapping, household grouping and export. The review now shows household assignments, trims mapped values, flags repeated email addresses within a file, and requires an explicit decision about possible duplicates. Uploading an invalid replacement file clears the earlier preview.

Guest preview allows household selection and shows included and excluded event counts. It creates a separate, one-hour preview token. Preview tokens use the normal server-side household visibility rules, reject all guest mutations, and do not record invitation opens.

Your experience includes a coordinated four-piece identity preview and saved monogram, typography, curated accent, image focal point and optional planner attribution. These settings flow into guest invitations, RSVP, itinerary and wedding passes. Colours have separate light/dark variants. Each world retains its existing voice, ornaments and distinct image.

The overview action list identifies pending households, missing per-event meal choices, missing answers to required travel-related RSVP questions, and unanswered guest questions. Required travel questions are identified by travel/arrival/flight/hotel/accommodation/shuttle/transport in their English label; no travel requirement is inferred if no such question exists.

Guests can leave a private question in their invitation. The planning team answers under Guest questions; the response appears only for that household. Answers are not emailed automatically.

Pilot feedback can be recorded from any Studio screen, with open/in-progress/resolved states under Pilot feedback. Notes are saved for that wedding’s collaborators. This is an internal issue list, not an automatic support email or external ticket integration.

Migration `008_planner_pilot.sql` adds preview tokens, pilot feedback and private guest requests. The existing migration runner applies it on database startup.

Unfinished essentials, world/story choices, identity refinements, guest/event editors and spreadsheet reviews now recover from local drafts. Draft keys include the current account and wedding; successful saves remove the corresponding draft. Closing an editor keeps its draft, while Discard local draft returns to saved values. The selected setup chapter and open guest/event/import editor are recovered too. This is device/browser storage, not cross-device synchronization. Passwords and billing fields are not stored in drafts. Storage failures are reported without preventing normal saving.

Four editable event starters fill the title, description and suggested local start/end times relative to the wedding date. Venue suggestions cover recognized destination names, require an explicit selection, and decline to guess if the text matches multiple zones. End-before-start errors and event overlaps receive guidance; overlaps are advisory because parallel/private events may be intentional. Daylight-saving gaps and ambiguous times still use the existing event-time validation.

Spreadsheet mapping recognizes common exported header variants, separators and accented aliases. Name, email and household cells are editable in the review table, with field-specific explanations and original CSV row numbers. Corrections and column choices recover on reload. Changing a mapping or correction requires duplicate review again; a newer file selection supersedes an earlier parse.

The setup workbench includes one live design preview for local names, date, location, language, world, story, opening style and identity choices, alongside the saved programme. It is explicitly a design preview; the existing household preview remains the place to verify private event access and guest behavior.

Direct planning-platform integrations, user-created event-template libraries and printable stationery remain outside this implementation. Existing planner document exports remain available.

Validation: `npm run check` and `npx playwright test tests/e2e/planner-pilot.spec.ts`. If Playwright’s bundled browser is unavailable, set `PLAYWRIGHT_CHANNEL=msedge` or `chrome` to use an installed browser.
