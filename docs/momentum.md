# Wedding Momentum

The Studio reads one derived model in `src/lib/momentum.ts`. It does not store
points, daily streaks or a separate copy of guest state. Chapters can reopen when
the underlying wedding changes. Setup retains its five explicit reviews.

Recommendations combine dependencies, venue-local deadlines, operational urgency
and affected people. Overdue invited replies outrank visual setup; delivery
problems outrank optional work. Near the wedding, meals, required answers and
seating rise in priority. After the day, the album becomes the focus. Couples see
one next step; planners see intervention-oriented copy over the same calculations.
Viewers get review links, with server authorization unchanged.

Contact readiness is per household, using the same primary/non-plus-one preference
as campaign sending. Having a live private link is reported as exactly that; it is
not proof of delivery. Demo dispatches are never described as real email sends.
Optional blank dietary notes are not blockers. Required household answers count
once for the household, while exception lists show the affected people.

Guest and RSVP filters live in the URL. A reminder intent opens Messages with the
`invited-pending` audience and a deadline-aware template. That audience is checked
again by the send service against live, non-preview invitation tokens. Existing
contact, consent, provider, retry and duplicate-send safeguards still apply. A
recommendation never sends a message. Meal/answer exceptions link directly to the
relevant household's invitation tools; guests retain control of their responses.

Final readiness requires setup reviews and the current guest plan to be complete,
followed by an explicit review in Insights. `/api/studio/momentum-review` validates
the current plan and its revision signature. Guest, reply, seating, travel,
question or schedule changes invalidate that review. Opening documents alone does
not mark the chapter complete.

## Feedback and learning

Micro actions retain the existing status toast. Confirmed changes in server data
produce a paper-based consequence panel. Chapter transitions and invitation sends
receive more prominent, dismissible feedback. Import feedback reports actual
guest/household changes and the resulting contact readiness.

Migration `020_momentum_events.sql` adds content-free pilot measurements. The
authenticated `/api/momentum` endpoint accepts only strict enum identifiers and
bounded numeric counts/durations. It stores no guest, wedding, account, session,
URL or content identifiers. Authorization/rate limiting uses the existing session
but does not copy its identity into the event. Do Not Track disables the client.
Telemetry failures cannot block wedding work. An operator-only GET returns 30-day
aggregates, separating demos from live accounts.
The Operations dashboard now presents these aggregates in a dedicated Momentum
panel with real/demo selection, an honest empty state, and expandable effort by
screen. Counts are events, never unique people or conversion rates. Account
milestones separately label generated invitation links without implying delivery.

Elapsed times are measured from the first Studio visit in the current browser tab,
not from account creation. Completion is an observed data transition; it is not a
replacement for the authoritative audit log. A workflow abandonment event means
the page was left with the selected action unresolved, not that the user failed.
This initial pilot report measures effort; it does not infer an individual user's
engagement history or send data to a third-party analytics provider.

## Cherry blossom stationery

`WeddingDesign.botanical` is a validated optional direction (`none` or
`cherry-blossom`), independent of the six worlds and two opening styles. Existing
designs normalize to `none`. Draft saves, merge conflicts, publication and guest
authorization follow the existing design system. The settings endpoint cannot
overwrite a published botanical choice behind the design draft.

The artwork is an authored SVG specimen in `guest-botanical.tsx`: budding wood at
the opening, an asymmetric flowering bough between the photograph and name card,
three resting petals, and a pressed reply specimen that flowers after a saved
response. The bough replaces the world's existing silk/sprig ornament. It retains
the world's typography, paper, voice and guest controls. Mobile uses a lower,
vertical crop. GSAP provides one opening release and restrained depth movement;
reduced motion retains every physical layer without the movement. Decorative
artwork is hidden from assistive technology and cannot intercept input.

The opening and unfolded card share the responsive composition in
`guest-stationery.css`. Both opening styles have a separate, labelled action
below the envelope. The crafted letter grows with its names rather than clipping
them behind a fixed flap. On desktop the invitation balances a readable letter
with a venue print; phones place the print and useful keepsakes after the letter
in reading order. Photo captions and actions stay clear of the paper layers.
`tests/e2e/invitation-layout.spec.ts` captures both openings and the unfolded card
at 1440, 390 and 320 pixels, including animated entrances and image decoding.

Atra was not exposed by the installed tools or project dependencies. This
implementation uses the project's SVG and GSAP capabilities without introducing
an unverified integration.

## Verification

`tests/momentum.test.ts` covers empty weddings, household contacts, deadline
priority/timezones, required answer scope, dispatch outcomes, memories, review
invalidation and telemetry privacy. `tests/wedding-design.test.ts` covers the
botanical schema and merge behavior. `tests/e2e/momentum-blossom.spec.ts` checks
exception resolution, intent preparation, draft/publication isolation, onboarding,
all six worlds, both openings, Spanish, keyboard opening and reduced motion at
320px. Screenshots are written under `artifacts/` for visual review.
