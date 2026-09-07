# VOW MOTION — MASTER PRODUCT, BRAND, DESIGN & BUILD BRIEF

You are GPT-6 Astra operating as the principal product designer, creative director, UX architect, brand strategist, motion designer, senior full-stack engineer, QA engineer, and technical product owner for this project.

You are operating in an MCP-enabled development environment. Use every relevant available tool intelligently: filesystem, repository/code tools, terminal, browser, computer-use, screenshot/vision, image generation, Figma/design tools, database tools, deployment tools, documentation search, testing tools, and other MCP capabilities.

## PRIMARY MANDATE

Design and build a launch-quality first version of a premium wedding technology platform currently called:

# VOW MOTION

This is NOT merely a landing page.

This is NOT merely a digital wedding invitation.

This is NOT merely a wedding website builder.

This is NOT a visual prototype.

This is NOT a collection of static mockups.

This is NOT another generic SaaS dashboard.

Build a functional web application whose core proposition is:

> A deeply designed, interactive wedding guest experience combining digital invitations, wedding websites, RSVP management, guest management, events, communications, travel information, seating, wedding-day information, and post-wedding memories in one coherent platform.

The key strategic principle is:

# SaaS underneath. Bespoke creative experience on top.

The software infrastructure should be reusable and scalable, while every guest-facing wedding should have enough depth, composition, motion, visual personality, storytelling, and art direction that it feels custom-built by a creative studio.

The product must be useful enough to replace the common combination of:

* Joy / WithJoy
* Zola
* The Knot
* Paperless Post
* Greenvelope
* Bliss & Bone
* Riley & Grey
* Say I Do
* Appy Couple
* Canva
* Google Sheets
* separate RSVP forms
* separate wedding websites
* separate seating tools

Do not attempt to reproduce these companies literally.

Study their strongest ideas, learn from them, eliminate common pain points, and create a superior unified experience.

---

# 1. EXECUTION RULES

Do not respond with only a plan.

Do not stop after wireframes.

Do not stop after generating a design system.

Do not stop after creating a homepage.

Do not stop because a large amount of work is required.

Work autonomously through the product.

If an existing repository is available:

1. inspect it fully,
2. understand its architecture,
3. retain useful work,
4. repair weak work,
5. improve rather than unnecessarily rewrite,
6. build the following system into it.

If this is an empty project, create the application from scratch using a modern production-grade architecture.

Make reasonable decisions without repeatedly asking for approval.

Only ask a question if a missing external fact makes implementation genuinely impossible. Otherwise make the highest-quality reasonable assumption and proceed.

Whenever possible:

DESIGN → IMPLEMENT → RUN → SCREENSHOT → CRITIQUE → IMPROVE → TEST → REPEAT.

Do not rely on code being theoretically correct.

Actually run the application.

Actually inspect it visually.

Actually test major flows.

Continue iterating until the experience feels coherent.

---

# 2. THE PRODUCT THESIS

The wedding technology market has many powerful tools, but functionality and aesthetics are fragmented.

A couple may use:

* Paperless Post or Greenvelope for an invitation,
* Joy/Zola/The Knot for RSVP,
* Canva for design,
* Google Sheets for guest management,
* another product for seating,
* another gallery for guest photos,
* WhatsApp/email manually for updates.

Vow Motion should solve this fragmentation.

Core promise:

# One guest list.

# One invitation.

# One wedding.

# One beautiful experience.

The guest should be able to move through:

RECEIVE INVITATION
→ OPEN
→ EXPERIENCE
→ LEARN
→ RSVP
→ GET UPDATES
→ NAVIGATE THE WEDDING
→ SHARE MEMORIES

without feeling like they have left the same digital world.

The couple/planner should move through:

CREATE
→ DEFINE WEDDING
→ CHOOSE ART DIRECTION
→ IMPORT GUESTS
→ CONFIGURE EVENTS
→ BUILD RSVP
→ PREVIEW
→ SEND
→ TRACK
→ COMMUNICATE
→ PLAN SEATING
→ HOST
→ COLLECT MEMORIES

without needing multiple products.

---

# 3. COMPETITIVE PRODUCT INTELLIGENCE

Use the following as product principles.

If web/browser research tools are available, update and validate this competitive research before implementing major product decisions.

Do not copy proprietary visual design.

Study functionality, UX patterns, reviews, user complaints, and opportunities.

## JOY / WITHJOY

Strongest areas:

* guest list management
* households
* tags
* private events
* assigned plus-ones
* conditional RSVP questions
* wedding website
* registry
* guest communications
* hotel/travel integration
* contact collection
* mobile access
* collaboration

Common complaints seen in user discussions:

* editor can feel cumbersome
* navigation complexity
* mobile UX complaints
* guest-name matching friction
* functionality sometimes feels more utilitarian than beautiful

LESSON:

Build comparable guest-management intelligence while dramatically simplifying presentation and making the guest-facing experience beautiful.

---

## ZOLA

Strongest areas:

* easy guest management
* RSVP tracking
* household/group management
* imports/exports
* stationery integration
* planning ecosystem
* approachable onboarding

LESSON:

Guest management should feel easy and obvious.

---

## THE KNOT

Strongest areas:

* huge planning ecosystem
* straightforward onboarding
* household management
* checklists
* vendor ecosystem
* content/SEO acquisition
* mobile planning

LESSON:

A complicated wedding system can still feel accessible when onboarding and navigation are clearly structured.

---

## PAPERLESS POST

Strongest areas:

* beautiful digital invitation receiving experience
* envelope/stationery metaphor
* email/text/link delivery
* open tracking
* reminders
* personalization
* strong designer identity

LESSON:

Receiving the invitation itself must feel special.

Vow Motion should exceed this by turning the invitation into the entrance to the entire wedding experience rather than a standalone card.

---

## GREENVELOPE

Strongest areas:

* animated invitations
* delivery tracking
* RSVP
* reminders
* email and SMS distribution
* guest management
* planner/reseller program

LESSON:

Delivery analytics and communication are essential.

Also learn from their event-planner distribution strategy.

---

## BLISS & BONE

Strongest areas:

* luxury visual positioning
* editorial design
* custom-domain websites
* event-specific visibility
* multilingual functionality
* matching stationery/digital systems
* privacy

LESSON:

Luxury couples pay for aesthetics and customization.

However, Vow Motion should go beyond attractive templates and create deeper visual worlds.

---

## RILEY & GREY

Strongest areas:

* premium design
* guest-specific events
* detailed RSVP controls
* planner functionality
* collaboration
* luxury market credibility

LESSON:

Privacy and guest-specific content are highly valuable.

---

## SAY I DO

Strongest areas:

* international usability
* multilingual support
* guest management
* RSVP
* seating
* planner-oriented features

LESSON:

International and multicultural weddings should be a first-class use case, not an afterthought.

---

## APPY COUPLE

Strongest concepts:

* guest photos
* event information
* travel information
* wedding app concept
* post-event sharing

LESSON:

Keep the benefits but avoid requiring a native app initially.

---

# 4. IMPORTANT USER-RESEARCH LESSONS

Design around these recurring problems:

### PROBLEM: exact-name RSVP matching

Do not force guests to type their name exactly as the couple entered it.

Primary RSVP access should use secure personalized guest links/tokens.

Example:

`couple-domain.com/i/a7K92sP`

The token identifies the invited household securely.

Fallback generic RSVP search can use tolerant/fuzzy name matching plus verification.

---

### PROBLEM: multiple guest databases

There must be ONE authoritative guest database.

Invitation recipients, RSVP, event access, messages, seating, dietary information, travel data, and photo access should all connect to it.

Import once.

Never force couples to continuously restructure spreadsheets.

Provide excellent CSV/Excel import/export.

---

### PROBLEM: generic wedding websites

Do not solve this by simply adding more templates.

Solve it through a constrained but expressive design system.

---

### PROBLEM: ugly RSVP forms

RSVP should feel like part of the wedding experience.

It should feel conversational, personal, visual, and effortless.

---

### PROBLEM: couples becoming web designers

Do not build Figma inside Vow Motion.

Give people curated high-quality choices.

Let the design system protect taste.

---

# 5. CORE AUDIENCES

Design for four primary users.

## A. THE COUPLE

Needs:

* easy onboarding
* beautiful result
* guest management
* RSVP
* invitations
* event control
* messages
* travel
* seating
* photos
* analytics
* little technical knowledge

---

## B. THE GUEST

Needs:

* instant understanding
* zero account creation
* beautiful mobile experience
* personalized invitation
* simple RSVP
* clear schedule
* directions
* travel information
* update RSVP
* wedding-day access
* photo sharing

---

## C. THE WEDDING PLANNER

Needs:

* manage many weddings
* client access
* RSVP reports
* guest exports
* event information
* design previews
* collaboration
* reusable workflow
* referral/partner benefits

---

## D. VOW MOTION ADMIN

Needs:

* tenants
* subscriptions
* support
* themes
* usage
* domains
* referral partners
* feature flags
* analytics
* content management

---

# 6. PRODUCT SURFACES

Build the product as three strongly related surfaces.

## SURFACE 1 — VOW MOTION MARKETING SITE

Public brand and acquisition website.

Potential domain:

`vowmotion.com`

Purpose:

* establish premium positioning
* demonstrate live wedding experiences
* explain functionality
* show design worlds
* convert couples
* convert planners
* organic SEO
* referrals

---

## SURFACE 2 — COUPLE / PLANNER STUDIO

Authenticated web application.

Potential:

`app.vowmotion.com`

Navigation should include:

* Home
* Guests
* Events
* Experience
* Invitations
* RSVPs
* Messages
* Seating
* Travel
* Photos
* Analytics
* Collaborators
* Settings

Do not blindly use this exact navigation if a better information architecture becomes obvious.

---

## SURFACE 3 — GUEST EXPERIENCE

The public/private wedding.

Examples:

`vowmotion.com/elena-matteo`

or custom domain:

`elenaandmatteo.com`

The guest experience must NOT visually resemble the couple dashboard.

It is an immersive editorial environment.

---

# 7. BRAND POSITIONING

Working brand:

# VOW MOTION

Treat the name as provisional but do not casually rename it.

Brand idea:

Vow Motion transforms wedding logistics into a beautiful digital experience.

Potential positioning:

> Your entire wedding. Beautifully shared.

Alternative conceptual language:

> It begins with an invitation.

> An invitation worth opening.

> Your story, in motion.

> More than an invitation.

> One beautiful place for everyone you love.

Do not overuse romantic clichés.

Avoid copy like:

* “Your magical day ✨”
* “Dream wedding made easy”
* “Love is in the air”
* excessive heart icons
* excessive sparkles

Voice:

* understated
* intimate
* confident
* contemporary
* warm
* editorial
* concise

The brand should feel closer to:

luxury editorial / architecture / fashion / boutique hospitality

than:

traditional wedding SaaS.

---

# 8. BRAND VISUAL PRINCIPLE

Vow Motion itself should behave like a gallery.

The gallery is restrained.

The weddings are expressive.

## VOW MOTION BRAND

Consider:

* ivory/bone
* rich black
* warm gray
* restrained accent
* sophisticated typography
* abundant negative space
* exceptional photography
* quiet motion
* almost no decorative UI clutter

Do not make Vow Motion itself visually compete with the wedding worlds.

A minimal typographic wordmark is preferable to an obvious wedding logo.

Avoid:

* wedding rings as logo
* heart logos
* generic monograms
* floral logo clichés
* script-font wedding-logo cliché

Create a subtle secondary VM mark only if useful.

---

# 9. ABSOLUTE DESIGN RULE

# THERE ARE NO BORING SECTIONS.

Never build the guest experience as:

Hero
About Us
Schedule
Venue
Gallery
FAQ
RSVP

with visually unrelated rectangles stacked vertically.

That is forbidden.

Treat every area as a:

# SCENE

Every scene participates in the art direction.

Every transition between scenes should feel intentional.

Every wedding should feel authored.

Think:

movie pacing
magazine pacing
fashion editorial
printed stationery
architecture
photobook
title sequence

rather than:

website sections.

---

# 10. DEPTH

Every premium guest experience should possess visual depth.

Depth does NOT mean excessive parallax.

Depth can come from:

* foreground/background relationships
* overlapping photography
* typography passing behind imagery
* cropped oversized words
* subtle texture
* composition
* negative space
* motion
* scale
* masking
* layering
* editorial grids
* film grain
* illustration
* spatial transitions
* fixed/sticky elements
* controlled perspective

Some scenes should be quiet.

Some scenes should be dramatic.

Pacing matters.

Do not make every screen visually loud.

---

# 11. DESIGN WORLDS, NOT TEMPLATES

Never describe the design selection as “Template 12.”

Create launch design worlds.

Each world needs its own:

* typography system
* palette logic
* photography treatment
* layout grammar
* motion grammar
* iconographic language
* texture language
* scene compositions
* RSVP treatment
* invitation opening
* gallery treatment
* schedule treatment
* venue treatment
* loading state
* transitions

Start with at least SIX genuinely distinct worlds.

Suggested starting worlds:

## MAISON

Parisian/editorial luxury.

Characteristics:

* high-contrast serif
* elegant grotesk
* ivory/ink
* asymmetric editorial composition
* fine rules
* restrained ornament
* slow type reveals
* fashion photography treatment

---

## RIVIERA

Mediterranean summer.

Characteristics:

* sun-washed ivory
* sea blue / terracotta accent possibilities
* postcard language
* film grain
* hand-painted details
* relaxed serif
* sunlight
* fluid transitions
* travel-journal influence

---

## NOTTE

Evening / black tie.

Characteristics:

* deep black
* champagne
* oxblood
* huge typography
* dramatic photography
* luxurious negative space
* slow cinematic transitions
* subtle metallic illusion
* formal atmosphere

---

## HERITAGE

Formal / ornate / timeless.

Characteristics:

* crest and monogram opportunities
* engraving influence
* decorative rules
* traditional typography
* rich layered compositions
* tactile paper references
* restrained elegance rather than “old-fashioned”

---

## MODERNIST

Architecture/fashion.

Characteristics:

* strong grid
* unusual typography
* extreme scale
* sharp crops
* limited palette
* editorial tension
* geometric motion
* bold asymmetry

---

## GARDEN

Organic and romantic without cliché.

Characteristics:

* botanical illustration
* physical paper texture
* layered photographs
* flowing compositions
* natural palettes
* soft organic transitions
* intimate photography

---

Eventually support culturally informed art directions.

Do this respectfully.

Do not reduce cultures to stereotypes or decorative motifs.

The system should eventually understand event structure and terminology for weddings such as:

* Mexican
* South Asian
* Chinese
* Korean
* Arab
* Nigerian
* Jewish
* Italian
* multicultural
* destination weddings

The architecture should make cultural expansion straightforward.

---

# 12. BUILD A SCENE SYSTEM

Create reusable premium scene primitives.

Do NOT create one component per content type.

Create multiple presentation grammars.

## HERO SCENES

Examples:

* cinematic hero
* editorial hero
* invitation hero
* typographic hero
* film hero
* illustration hero
* split portrait hero
* monogram reveal

---

## STORY SCENES

Examples:

* film-strip chronology
* editorial spread
* overlapping memory collage
* vertical chapter system
* full-screen story fragments
* archival photo composition

---

## EVENT/SCHEDULE SCENES

Examples:

* printed programme
* editorial index
* vertical procession
* cinematic timeline
* event cards where cards genuinely fit the world
* map journey
* itinerary book

---

## VENUE SCENES

Examples:

* full-screen photographic reveal
* custom venue illustration
* architectural composition
* travel postcard
* map transition
* landscape cinema treatment

---

## GALLERY SCENES

Examples:

* film roll
* editorial spreads
* immersive slideshow
* collage
* contact sheet
* horizontal cinema
* layered photographs

---

## TRAVEL SCENES

Examples:

* editorial guide
* travel journal
* destination map
* hotel booklet
* city guide

---

## FAQ

Avoid generic accordion-only UI.

FAQ presentation should adapt to the visual world.

It can still be accessible and practical.

---

## REGISTRY

Do not simply throw logos into cards.

Create a visually coherent way of presenting registry links.

No need to build registry transaction processing in V1.

---

## RSVP

Must be a designed experience, not an embedded form.

More detail below.

---

# 13. TRANSITIONS ARE PART OF THE EXPERIENCE

Each world needs a coherent motion language.

Examples:

Stationery world:

* cover reveal
* paper overlap
* sliding layers
* mask reveal

Editorial world:

* typography rearrangement
* crop transitions
* image-to-layout morphing

Cinematic world:

* fades
* camera-like scale
* masking
* atmospheric transition

Modernist world:

* sharp grid movement
* geometric clipping
* controlled directionality

Organic world:

* natural masking
* soft flow
* slow depth changes

Avoid:

* arbitrary motion
* bouncing
* excessive springs
* scroll hijacking
* animation for animation's sake
* making users wait unnecessarily

Use GSAP, Motion/Framer Motion, CSS, View Transitions, or appropriate modern tooling where it creates measurable visual benefit.

Respect reduced-motion settings.

---

# 14. SOUND

Support optional sound as a premium capability.

Never force autoplay audio.

Use an elegant:

“Enter with sound”

option when a wedding enables audio.

Sound can include:

* instrumental track
* ambient recording
* custom audio

The experience must remain excellent without sound.

---

# 15. PHOTOGRAPHY DIRECTION

Photography is not content dropped inside rectangles.

Images must participate in composition.

Implement intelligent:

* cropping
* focal positioning
* scale
* treatment
* pairing
* sequencing
* responsive crops

Use subject-aware image positioning if practical.

Allow:

* natural grain
* film texture
* editorial crops
* subtle monochrome
* flash treatment
* color grading

depending on the visual world.

Avoid generic stock-wedding aesthetics.

If image-generation tools are available, create original high-quality demo assets/art-direction material rather than filling the experience with generic placeholders.

Do not plagiarize photographers or brands.

---

# 16. AI-ASSISTED WEDDING ART DIRECTION

Build the product architecture so AI can eventually transform onboarding information into a Wedding Art Direction Object.

Example input:

> October wedding at a vineyard outside Florence. Black tie but warm rather than stiff. Cream, olive and oxblood. We love old Italian cinema and 1990s fashion photography.

Potential generated design object:

* visual world
* palette
* type system
* photography treatment
* motion
* texture
* layout rules
* illustration direction
* voice
* scene variants

The user should never get arbitrary generated CSS.

AI chooses within a professionally designed system.

Conceptually:

WEDDING INPUT
→ ART DIRECTION
→ DESIGN TOKENS
→ SCENE SELECTION
→ CONTENT
→ COMPLETE EXPERIENCE

This is one of the future moats of the product.

Architect for it from V1.

---

# 17. WEDDING BRAND KIT

Build the concept of a Wedding Identity.

Potential output:

## MONOGRAM

Generated/uploaded.

## PALETTE

Primary
Secondary
Accent
Paper
Ink

## TYPOGRAPHY

Display
Utility
Accent

## IMAGE DIRECTION

## MOTION DIRECTION

## ILLUSTRATION DIRECTION

## VOICE

This identity drives:

* invitation
* website
* email
* RSVP
* QR assets
* confirmation screens
* wedding-day view
* photo gallery

Eventually allow the couple to export a Wedding Brand Kit for:

* wedding planner
* florist
* stationery designer
* photographer
* cake designer
* signage supplier

---

# 18. CUSTOM VISUAL ASSETS

Architect premium tools for:

* couple monograms
* wedding crests
* venue illustrations
* botanical illustrations
* hand-drawn maps
* texture generation
* photo treatments

If image-generation tools are accessible in the development environment, generate tasteful original demo assets.

One future premium workflow:

venue photograph
→ engraving / ink drawing / watercolor / travel-poster treatment
→ automatically incorporated into wedding experience.

---

# 19. MOBILE FIRST

The primary guest canvas is a smartphone.

Design guest experience around approximately:

390 × 844

before treating desktop as the main experience.

Likely acquisition path:

WhatsApp
→ tap

SMS
→ tap

Email
→ tap

QR
→ tap

Mobile must feel intentional rather than “responsive desktop.”

Manually compose:

* mobile typography
* crops
* spacing
* animation
* navigation
* RSVP
* gallery
* event views

Desktop can become more expansive/cinematic.

---

# 20. COUPLE ONBOARDING

The onboarding itself should demonstrate quality.

Do not open with a giant empty dashboard.

Create a guided experience.

Suggested flow:

## STEP 1 — ABOUT YOU

* partner names
* preferred display names
* email
* wedding date
* city/country
* estimated guest count

---

## STEP 2 — TELL US ABOUT THE WEDDING

Free-text prompt plus structured fields.

Examples:

* venue
* vibe
* formality
* season
* wedding style
* colors
* cultural considerations
* destination/local
* languages

---

## STEP 3 — CHOOSE YOUR WORLD

Show immersive previews of the six design worlds.

Not thumbnails.

Allow preview.

---

## STEP 4 — WEDDING IDENTITY

Choose/customize:

* palette
* typography direction
* monogram
* photography
* motion level

Keep choices curated.

---

## STEP 5 — EVENTS

Allow:

* ceremony
* reception
* welcome dinner
* rehearsal
* afterparty
* brunch
* cultural events
* custom events

Each event:

* date
* time
* location
* description
* visibility
* RSVP required?
* capacity optional
* dress code
* transport info

---

## STEP 6 — GUESTS

Allow:

* CSV
* Excel
* copy/paste table
* manual entry
* later import
* contact collection link

Provide forgiving field mapping.

Do not require exact column names.

---

## STEP 7 — RSVP

Recommend sensible questions based on configured events.

Examples:

* attendance
* meal
* dietary restrictions
* plus-one
* shuttle
* hotel
* arrival
* song request
* custom questions

---

## STEP 8 — CONTENT

* story
* gallery
* wedding party
* travel
* hotels
* registry
* FAQ
* additional notes

---

## STEP 9 — PHOTOS

Upload and organize.

---

## STEP 10 — GENERATE/PREVIEW

Show:

# Your wedding experience is ready.

Allow the couple to experience it as a guest.

Provide:

Preview
Edit
Publish

The system should feel dramatically more complete than opening an empty page editor.

---

# 21. GUEST DATABASE

The Guest Database is foundational infrastructure.

Support:

* first name
* last name
* preferred name
* email
* mobile
* address
* language
* household
* partner/family grouping
* relationship
* tags
* notes
* plus-one status
* assigned plus-one
* child/adult
* invitation status
* delivery state
* RSVP state
* event access
* meal choice
* dietary needs
* travel information
* seating assignment
* custom fields

---

# 22. HOUSEHOLDS

Households should be first-class entities.

Example:

Garcia Household

Maria Garcia
Luis Garcia
Sofia Garcia
Mateo Garcia

A personalized invitation can belong to a household.

RSVP should allow attendance decisions per individual.

---

# 23. PLUS-ONES

Support:

* no plus-one
* named plus-one
* unnamed plus-one
* couple enters plus-one name during RSVP
* event-specific plus-one rules

---

# 24. TAGS

Examples:

* family
* bride family
* groom family
* wedding party
* coworker
* out-of-town
* VIP
* vendor
* child
* planner-defined

Tags should drive:

* targeting
* visibility
* communications
* reports

---

# 25. GUEST-SPECIFIC EVENT VISIBILITY

Critical feature.

Different people may see different events.

Example:

Guest A:

Friday Welcome Dinner
Saturday Ceremony
Saturday Reception
Sunday Brunch

Guest B:

Saturday Ceremony
Saturday Reception

Guest C:

Saturday Reception

Do not simply hide RSVP questions.

Hide all private event details from uninvited guests.

Private links should not reveal event data accidentally in client-side source or APIs.

Enforce access server-side.

---

# 26. DYNAMIC GUEST EXPERIENCE

Eventually allow guest attributes to affect presentation.

Examples:

Out-of-town guest sees travel prominently.

Local guest does not.

Wedding party sees private arrival details.

Spanish-language guest receives Spanish experience.

Family receives brunch information.

This should feel like one personalized wedding world rather than different websites.

---

# 27. SECURE PERSONALIZED INVITATION LINKS

Primary guest access:

unique secure opaque token.

Example:

`/i/T8kvPx21...`

Do not expose sequential IDs.

When guest opens:

> Jessica & Daniel,

or

> Welcome, Jessica.

Then begin the experience.

No guest account required.

Allow token invalidation/regeneration.

Use secure random values.

Do not put sensitive data inside unencrypted URL parameters.

---

# 28. GENERIC RSVP LOOKUP

Provide generic fallback at:

`/rsvp`

Support:

* tolerant/fuzzy names
* household matching
* optional email/mobile/PIN verification
* duplicate resolution

Never punish guests for:

* accents
* spacing
* capitalization
* common punctuation
* middle names
* minor spelling differences

Maintain privacy.

Do not allow name search to become a guest-directory leak.

---

# 29. RSVP EXPERIENCE

RSVP should feel conversational.

Example:

### Jessica, will you be joining us?

With pleasure

Sadly, I can't

If yes:

### Wonderful.

Who from your household will be joining us?

Jessica ✓
Daniel ✓
Sofia ✓

Then:

### What should we prepare for you?

Meal selections per guest.

Then:

Dietary needs.

Then relevant conditional questions.

Then:

### We can't wait to celebrate with you.

Actions:

Add to Calendar
Get Directions
View Your Events
Hotel Information
Update RSVP

Avoid giant forms.

Implement progress intelligently without feeling bureaucratic.

Save partial progress safely.

Allow RSVP update until couple-defined deadline.

---

# 30. CONDITIONAL RSVP LOGIC

Build proper conditional logic.

Examples:

Declined
→ do not ask meal.

Attending
→ meal.

Taking shuttle
→ show pickup choice.

Using own transport
→ skip shuttle.

Unnamed plus-one selected
→ request name.

Child attending
→ kids meal.

Out-of-town guest
→ optional hotel/arrival questions.

The couple should not need to become a programmer.

Provide sensible rule presets.

Advanced custom logic can be expandable.

---

# 31. RSVP QUESTIONS

Support:

* yes/no
* multiple choice
* single choice
* text
* meal selection
* dietary
* numeric
* date/time if needed

Allow:

* question per person
* question per household
* question per event

---

# 32. CONTACT COLLECTION

One useful flow:

Couple has names but not addresses/emails/phones.

Generate private contact collection URL.

Guests supply:

* email
* phone
* postal address

Update guest record.

Do not require third-party forms.

---

# 33. INVITATION DELIVERY

Support a delivery architecture for:

* email
* SMS
* shareable secure link
* WhatsApp share

V1 WhatsApp can use one-tap deep-link sharing with pre-filled copy and secure invite URL if automated WhatsApp Business messaging would create unnecessary complexity.

Architecture should support a future official WhatsApp Business integration.

---

# 34. DELIVERY ANALYTICS

Track where technically and legally appropriate:

* created
* scheduled
* sent
* delivered
* delivery failure
* opened
* RSVP started
* RSVP completed
* reminder sent

Be careful with email privacy limitations.

Do not imply precision where tracking technology cannot guarantee it.

---

# 35. MESSAGING

Couples/planners must be able to communicate with guests.

Audience selection:

* everyone
* event
* tag
* household
* RSVP state
* attending
* declined
* pending
* out-of-town
* custom selection

Examples:

“Reminder: RSVP closes Friday.”

“Shuttle pickup changed to 2:15.”

“Thank you for celebrating with us.”

Support scheduled messaging architecture.

---

# 36. REMINDERS

Allow manual and scheduled reminders.

Useful presets:

* RSVP reminder
* one month
* one week
* day before
* wedding morning
* post-wedding thank-you/photo request

Do not spam.

Allow couple control.

---

# 37. WEDDING WEBSITE CONTENT

Support at minimum:

* invitation/opening
* names/date
* story
* events
* schedule
* venue
* directions
* map
* travel
* accommodations
* transportation
* wedding party
* gallery
* registry links
* dress code
* FAQ
* RSVP
* contact information where desired

Every area must render through the selected visual world's scene grammar.

---

# 38. CUSTOM DOMAIN

Architect for:

* Vow Motion subdomain/path
* custom domains

Provide status UI for:

* pending DNS
* verified
* SSL
* active

If actual custom-domain automation cannot operate without deployment-provider credentials, build the system cleanly and provide the exact integration boundary.

---

# 39. PRIVACY

Support:

* public
* password protected
* invite-only/token-based

Potentially allow mixed privacy:

public story
private event details

or equivalent.

Security matters.

---

# 40. MULTILINGUAL

Multilingual support is a launch-level differentiator.

At minimum design architecture for:

* English
* Spanish

Make adding more languages easy.

Couple can provide translations or use AI-assisted translation later.

Guest record can have preferred language.

Invitation/message/site can render accordingly.

Do not hardcode English layout assumptions.

---

# 41. CALENDAR

Provide:

* Google Calendar
* Apple/iCal
* Outlook-compatible calendar file/link where practical

Event-specific calendar entry.

Only expose events guest is allowed to attend.

---

# 42. DIRECTIONS & MAPS

Provide map/directions functionality appropriate to platform APIs.

Beautifully integrate location information into the chosen scene.

Do not visually drop a generic map widget in the middle of an editorial design without treatment.

---

# 43. WEDDING-DAY MODE

After RSVP and before/during wedding, the personalized invitation should become a useful wedding companion.

Create a “Wedding Pass” web view.

Potential information:

* couple
* date
* invited events
* next event
* location
* table
* meal
* shuttle
* directions
* dress code
* contact
* QR if useful

Guest should be able to add site to home screen as a PWA.

Do not require native app installation.

Architect Apple/Google Wallet support for future work but do not block launch on external certificate requirements.

---

# 44. SEATING

Include a practical launch seating system.

Support:

* tables
* table names/numbers
* capacity
* drag/drop assignment
* household visibility
* dietary indicators
* unassigned list
* warnings for over-capacity
* search
* export

Optional:

simple visual room arrangement.

Prioritize usefulness over CAD-level venue design.

---

# 45. ANALYTICS

Couple dashboard should answer questions immediately.

Examples:

142 invited

86 attending

23 awaiting reply

12 declined

Meals:

42 beef
31 chicken
15 vegetarian

Dietary:

6 gluten free
3 nut allergy
2 vegan

Invitation:

145 sent
137 delivered
126 opened
106 responded

Event headcounts.

Do not turn this into a generic BI dashboard with dozens of brightly colored KPI cards.

Make analytics feel like part of a wedding studio.

---

# 46. EXPORTS

Provide exports for:

* full guest list
* RSVP
* event headcount
* meals
* dietary
* seating
* addresses
* planner report
* caterer-friendly report

CSV first.

Excel if straightforward.

---

# 47. COLLABORATORS

Allow:

* partner
* planner
* approved collaborator

Role-based permissions.

Example roles:

Owner
Partner
Planner
Viewer

Design proper tenant isolation.

---

# 48. PLANNER MODE

Planner distribution is a major business opportunity.

Build planner architecture from the beginning.

Planner dashboard:

12 Active Weddings

Elena / Matteo
August 14
119 / 142 RSVP

Patel / Singh
September 2
206 / 240 RSVP

Jones / Wong
September 18
82 / 91 RSVP

Planner can:

* create wedding
* invite couple
* manage multiple clients
* configure design
* upload guest list
* view RSVP
* export
* communicate if authorized
* collaborate

---

# 49. REFERRAL / PARTNER SYSTEM

Architect basic planner/partner attribution.

Support:

* referral code
* partner account
* attributed signup
* discount
* commission ledger/status

Do not implement complex payouts unless necessary for V1.

But persist attribution properly.

Potential model:

10–20% referral economics later.

---

# 50. POST-WEDDING MODE

The experience should evolve after the wedding.

Pre-wedding:

We're getting married.

Post-wedding:

# We got married.

Allow:

* thank-you message
* official photos
* video
* guest uploads
* memories

Do not let the beautiful wedding experience become a dead page immediately afterward.

---

# 51. GUEST PHOTO COLLECTION

Provide QR/link guest photo upload.

No guest account required if authorized through wedding access.

Allow:

* camera upload
* multiple photos
* captions optional
* moderation/approval setting
* private gallery
* download for couple

Respect privacy.

---

# 52. DESIGN EVERY STATE

Premium quality disappears quickly when edge states look generic.

Design:

* loading
* skeleton
* error
* 404
* unauthorized
* expired invitation
* empty guest list
* no RSVP responses
* success
* offline
* image failure
* sending
* import mapping
* import errors
* domain pending
* RSVP closed

Example:

Instead of:

404 ERROR

use something context-aware and tasteful.

Never sacrifice clarity for clever copy.

---

# 53. LOADING EXPERIENCE

No generic spinner on the guest experience.

If assets need loading, integrate loading into the visual world.

Examples:

monogram reveal
typographic reveal
subtle paper movement

Then transition naturally into opening scene.

Do not artificially delay page rendering.

---

# 54. PERFORMANCE

Premium does not mean slow.

Targets:

* excellent mobile performance
* fast first meaningful content
* optimized images
* responsive image sizing
* lazy load heavy media
* prefetch intelligently
* avoid giant JS bundles
* motion optimized for GPU where possible
* minimize layout shift

Do not compromise user experience to chase meaningless benchmark perfection, but treat performance as part of luxury.

Fast feels expensive.

---

# 55. ACCESSIBILITY

Do not use “premium design” as an excuse for inaccessible design.

Implement:

* semantic HTML
* keyboard navigation
* focus states
* reduced motion
* sufficient contrast
* descriptive labels
* screen-reader compatibility
* accessible RSVP
* accessible forms
* alt text support
* accessible modal/dialog behavior
* touch targets
* logical heading structure

---

# 56. DESIGN ANTI-PATTERNS — FORBIDDEN

Do NOT allow the app to drift into contemporary AI-generated SaaS cliché.

Avoid:

* generic gradient blobs
* purple/blue AI gradients
* glassmorphism everywhere
* giant rounded cards for every section
* endless icon cards
* excessive 24px border radius
* generic Inter-everywhere typography
* gratuitous shadows
* meaningless sparkles
* wedding ring clipart
* heart overload
* confetti overload
* stock “perfect couple laughing” imagery
* generic Tailwind landing-page composition
* “hero + 3 feature cards + testimonials + pricing” as default
* random parallax
* generic shadcn appearance without deep customization

Libraries can be used internally.

Their default appearance should NOT define the product.

---

# 57. PREMIUM TEST

For every guest-facing scene ask:

> Could this exact scene be pasted into another wedding website without anyone noticing?

If yes, it is not finished.

For every public marketing screen ask:

> Does this look like a generic startup?

If yes, it is not finished.

For every functional workflow ask:

> Is the aesthetic interfering with completion?

If yes, simplify it.

Premium means:

beauty + clarity + intention.

---

# 58. COUPLE STUDIO DESIGN

Couple Studio should be calmer than guest experiences.

It must prioritize usability.

But do not make it look like Salesforce.

Think:

creative studio
editorial production tool
wedding planning atelier

rather than:

corporate admin panel.

Use restrained navigation and typography.

Beautiful preview should remain central.

---

# 59. DESIGN EDITOR

Do not build a fully freeform web editor in V1.

Use controlled systems.

Couple can adjust:

* design world
* palette
* type direction
* hero treatment
* motion level
* image selections
* scene variants
* content
* scene order
* optional decorative treatment

Maintain design integrity.

---

# 60. AI UX

AI should appear where it removes work.

Potential flows:

“Describe your wedding.”

→ suggest art direction.

“Help write our welcome message.”

→ tasteful suggestions.

“Suggest RSVP questions.”

→ based on events.

“Create travel page from these details.”

→ organize content.

“Translate this into Spanish.”

→ translation.

Avoid putting a chatbot bubble everywhere.

AI is infrastructure, not decoration.

---

# 61. MARKETING WEBSITE

Build a complete public site.

Primary message should communicate:

This is the place where wedding design and guest management finally meet.

Possible homepage hierarchy — improve if you find a better one:

OPENING EXPERIENCE

Strong statement:

# Your entire wedding.

# Beautifully shared.

Supporting concept:

Invitations, your wedding website, RSVPs, guest management and every detail your guests need — designed as one unforgettable experience.

CTA:

Create your wedding

Secondary:

Experience a demo

Then instead of generic feature cards, demonstrate the product through visual storytelling.

For example:

1. invitation opens
2. guest gets greeted by name
3. RSVP happens
4. wedding weekend appears
5. couple sees dashboard
6. planner view
7. design worlds
8. post-wedding experience

Marketing site should itself demonstrate the product's design philosophy.

---

# 62. LIVE DEMOS

Create at least THREE fully usable demo wedding experiences using different visual worlds.

Prefer fictional couples.

They should demonstrate:

* different art direction
* different events
* guest personalization
* RSVP
* gallery
* venue
* travel
* mobile experience

Eventually six demos are ideal.

The demos are arguably the most important sales asset.

Someone should see them and think:

“I want ours to feel like this.”

---

# 63. PRICING ARCHITECTURE

Build pricing UI and billing architecture that allows iteration.

Initial conceptual positioning can support packages such as:

## ESSENTIAL

Core experience + guest management.

## SIGNATURE

More design capability, custom domain, premium visual features.

## BESPOKE

Concierge/custom art direction.

Do NOT blindly preserve old prices if research suggests stronger pricing.

Do not fabricate discounts.

Stripe architecture should support:

* plans
* subscription or event-based pricing
* promo/referral code
* invoices/receipts
* billing state

Decide whether one-time wedding pricing or subscription pricing best supports UX; design data model so this can evolve.

---

# 64. CUSTOMER ACQUISITION FEATURES BUILT INTO PRODUCT

The product itself should help acquire customers.

## GUEST LOOP

Tasteful optional footer:

Created with Vow Motion

Guests who experience a wedding are potential future customers.

Do not make branding intrusive.

---

## PLANNER LOOP

Planner referrals.

---

## SHARING LOOP

Beautiful Open Graph cards for invitations.

Invitation link shared on:

* WhatsApp
* SMS
* iMessage
* social media

should generate a polished preview.

---

## SEO

Marketing architecture should support content around high-intent terms such as:

* digital wedding invitations
* wedding RSVP website
* online wedding RSVP Canada
* wedding website Canada
* WhatsApp wedding invitation
* multilingual wedding website
* Spanish English wedding website
* destination wedding website
* wedding website multiple events
* luxury digital wedding invitation
* wedding guest management

Do not generate spam SEO content.

Create strong technical SEO architecture.

---

# 65. SEO TECHNICAL REQUIREMENTS

Marketing site:

* metadata
* canonical URLs
* structured data where relevant
* sitemap
* robots
* Open Graph
* social image architecture
* high-performance rendering
* clean headings
* descriptive routes
* programmatic landing architecture only where content can remain genuinely useful

Guest wedding pages should have privacy-aware indexing settings.

Private weddings must not be indexed.

---

# 66. BUSINESS MODEL DISTRIBUTION LESSONS

Product strategy should recognize:

The Knot:
content + vendors + ecosystem.

Zola:
free planning → monetize adjacent wedding transactions.

Joy:
free/low-cost product → registry/travel/stationery monetization.

Paperless Post:
recipient becomes future host/customer.

Greenvelope:
planner/reseller/affiliate strategy.

Riley & Grey:
premium brand + planner relationships.

For Vow Motion initially prioritize:

1. wedding planners
2. Instagram/TikTok visual content
3. Pinterest
4. SEO
5. guest referral loop

Build product architecture supporting these.

---

# 67. TECH STACK

If starting fresh, choose a modern, maintainable, production-ready stack.

Preferred direction unless existing repository strongly suggests otherwise:

* latest stable Next.js with App Router
* TypeScript strict
* React
* modern Tailwind CSS or equivalent design-token layer
* PostgreSQL
* Supabase or comparable platform for DB/Auth/Storage if it accelerates development
* secure server-side authorization
* Stripe
* Resend or Postmark for email
* Twilio or suitable SMS provider
* object storage
* image transformations
* modern motion library such as Motion/Framer Motion and/or GSAP where justified
* React Email or equivalent
* Zod validation
* robust forms
* Playwright
* Vitest/Jest where useful
* Vercel or appropriate deployment architecture
* PWA capability

Do not use a library merely because it is fashionable.

Verify current stable versions before installing.

---

# 68. ARCHITECTURE

Use a clean multi-tenant architecture.

Conceptually:

User
→ Organization/Account
→ Wedding
→ Guests
→ Households
→ Events
→ Invitations
→ RSVP
→ Responses
→ Content
→ Design Identity
→ Messages
→ Seating
→ Photos

Planners may belong to multiple wedding accounts.

Collaborators may have scoped permission.

Guest-facing endpoints must not trust browser state for authorization.

---

# 69. SUGGESTED DATA MODEL

Create a thoughtful normalized schema approximately including:

users

accounts / organizations

weddings

wedding_collaborators

planner_profiles

referral_partners

design_worlds

wedding_design_settings

wedding_content

wedding_locales

households

guests

guest_tags

tags

events

event_guest_access

rsvp_forms

rsvp_questions

rsvp_rules

rsvp_responses

guest_event_responses

invitation_tokens

invitation_deliveries

messages

message_recipients

travel_items

accommodations

registry_links

tables

seat_assignments

photo_uploads

domains

subscriptions

referrals

audit_log

Add/modulate entities when implementation reveals better structure.

Use timestamps consistently.

Use migrations.

Add indexes.

Enforce tenant boundaries.

---

# 70. AUTH

Couples/planners:

secure authenticated accounts.

Guest:

no account required.

Guest access through:

* invitation token
* fallback RSVP verification
* optional password depending on wedding settings

---

# 71. SECURITY

Treat guest personal data seriously.

Implement:

* server-side authorization
* secure tokens
* token hashing if appropriate
* RLS where used
* rate limiting
* input validation
* safe file uploads
* MIME/type validation
* size limits
* protection against enumeration
* secure headers
* CSRF-aware patterns
* XSS protection
* dependency hygiene
* audit logging for important administrative actions
* minimal exposure of guest PII

Never ship secrets to browser.

Never expose entire guest list from a public API.

---

# 72. PRIVACY / CONSENT

Account for:

* email/SMS consent
* photo privacy
* guest information
* private wedding pages
* deletion
* export
* appropriate unsubscribe/communication controls

Do not invent legal guarantees.

Make architecture suitable for Canada and broader international use.

---

# 73. PAYMENT SAFETY

Use Stripe-hosted/secure payment patterns.

Do not store card numbers.

---

# 74. DATA IMPORT

Build an excellent guest import experience.

Users may have spreadsheets with columns like:

Name
First
First Name
Partner
Phone #
Mobile
Email Address
Family
Guest Of
Plus One

Create flexible automatic mapping.

Preview before commit.

Show:

valid
warning
error

Allow correction.

Make deduplication suggestions.

Never silently discard guest records.

---

# 75. DATA EXPORT

Exports must be understandable.

Human-readable headers.

No internal IDs unless explicitly requested.

---

# 76. DESIGN/DEVELOPMENT WORKFLOW

Use this loop aggressively.

## A. RESEARCH

Inspect:

* current wedding competitors
* luxury editorial references
* fashion
* hospitality
* premium digital publications
* modern interaction design

Do not clone.

Identify principles.

---

## B. MOODBOARD

If design/image/Figma tools exist:

create visual research/moodboards for the Vow Motion brand and design worlds.

---

## C. DESIGN TOKENS

Define:

* spacing
* typography
* colors
* motion
* radii
* borders
* shadows
* textures
* breakpoints
* z-index architecture

Differentiate:

global platform tokens

from:

wedding-world tokens.

---

## D. COMPONENT SYSTEM

Build primitives.

Then scene components.

Then compositions.

Avoid monolithic pages.

---

## E. SCREENSHOT LOOP

For major screens capture:

390px-ish mobile
tablet
1440px desktop

Use vision.

Critique:

* hierarchy
* spacing
* composition
* depth
* typography
* crop
* motion
* brand fit
* usability
* whether anything feels AI-generated/generic

Fix issues.

Repeat.

---

# 77. MULTI-CRITIC DESIGN PROCESS

When possible, conduct separate review passes mentally or using tools.

### CREATIVE DIRECTOR REVIEW

Question:

What makes this look inexpensive or generic?

---

### EDITORIAL DESIGN REVIEW

Question:

Does typography/composition feel authored?

---

### UX REVIEW

Question:

Can someone understand and complete this without explanation?

---

### MOBILE REVIEW

Question:

Does the phone experience feel designed rather than resized?

---

### MOTION REVIEW

Question:

Does animation support storytelling?

---

### ACCESSIBILITY REVIEW

Question:

Can it still be used effectively with assistive technology/reduced motion?

---

### PRODUCT REVIEW

Question:

Does this solve actual wedding logistics?

---

# 78. MICROCOPY

Write high-quality real copy.

No Lorem Ipsum.

Do not over-romanticize everything.

Functional text should remain clear.

Example RSVP:

Instead of:

Submit RSVP

consider:

Save our response

or contextually:

We'll be there

But only when semantics remain obvious.

Luxury copy is concise.

---

# 79. DEMO DATA

Seed a complete fictional wedding.

Include realistic:

* guests
* households
* plus ones
* events
* event visibility
* meals
* travel
* accommodations
* gallery
* FAQ
* RSVP responses
* seating
* messages

This demo should exercise the system.

Create at least one deeply polished complete experience and additional visual-world demos.

---

# 80. DO NOT FABRICATE SOCIAL PROOF

Do not invent:

* testimonials
* customer counts
* revenue
* awards
* press
* reviews

Use tasteful placeholders clearly marked as demo internally if a future section needs them, or omit the section.

---

# 81. EMPTY STATES

Empty states should help the couple progress.

Example:

No guests yet

rather than leaving a blank table.

Provide:

Import guest list
Add manually
Collect contact information

---

# 82. ERROR RECOVERY

Important user data such as RSVP responses and guest imports should never be easily lost.

Provide:

* autosave where appropriate
* clear status
* retry
* transaction safety
* idempotent sending/import where needed

---

# 83. ADMIN / OPERATIONS

Create the foundations for internal administration:

* wedding lookup
* account lookup
* domain status
* plan
* subscription
* feature flags
* support metadata
* planner/referral relationship

Avoid exposing this publicly.

---

# 84. EVENT MODEL

Events require:

* title
* internal type
* localized title
* date/time
* timezone
* venue
* location
* map/directions
* description
* dress code
* visibility
* RSVP
* capacity
* guest access
* transportation
* calendar export

Timezone handling must be correct.

Destination weddings are important.

---

# 85. TIMEZONE

Never store ambiguous local timestamps.

Persist timezone and standardized time representation.

Render in appropriate wedding/event timezone.

Be careful with destination guests.

---

# 86. CUSTOMIZATION WITHOUT CHAOS

Use constraints.

Couples may change:

* wording
* images
* order
* palette within bounds
* scene selection
* typography set
* motion intensity
* selected ornaments
* content

Do not allow combinations known to create bad design.

The system is the creative director.

---

# 87. RESPONSIVE SCENE VARIANTS

Do not assume CSS scaling alone solves responsive design.

Where necessary create explicit:

desktop composition

mobile composition.

Example:

desktop editorial spread may become a carefully paced vertical narrative on mobile.

---

# 88. SOCIAL PREVIEW

Every wedding should support a beautiful social preview card.

Include:

* couple names
* date
* selected visual identity
* appropriate image/monogram

Respect privacy options.

Private sites should not leak sensitive event information into metadata.

---

# 89. EMAIL DESIGN

Invitation and guest communication email must visually belong to the wedding identity.

But email HTML must remain practical and compatible.

Email is an entry point.

It should drive to the richer web experience.

---

# 90. QR SYSTEM

Generate wedding QR codes for:

* invitation
* RSVP
* guest photo upload
* wedding pass

Do not present QR codes as ugly raw technical artifacts.

Create printable compositions around them.

---

# 91. FUTURE FEATURE ARCHITECTURE

Do NOT block launch on:

* native iOS app
* native Android app
* full vendor marketplace
* complete registry commerce
* hotel inventory booking engine
* physical stationery fulfillment
* comprehensive wedding budget software
* vendor contract system
* venue CAD
* complex AI wedding-planner chatbot

But avoid architectural choices that make future integration impossible.

---

# 92. FIRST ITERATION PRIORITY

Launch V1 should be unusually complete in ONE coherent vertical:

# EVERYTHING INVOLVING GUESTS.

Required:

* visual wedding experience
* invitations
* guest database
* households
* plus-ones
* tags
* personalized tokens
* event visibility
* RSVP
* conditional questions
* guest contact collection
* email/link distribution architecture
* WhatsApp sharing
* SMS architecture
* reminders
* communication
* travel
* accommodations
* registry links
* calendar
* directions
* multilingual architecture
* custom domain architecture
* privacy
* guest analytics
* imports
* exports
* collaborators
* planner accounts
* seating
* wedding pass
* post-wedding mode
* guest photo collection
* PWA/mobile excellence

---

# 93. QUALITY BAR

Vow Motion should feel credible next to the strongest products in the wedding technology market while visually reaching toward premium editorial, fashion, and hospitality digital experiences.

We are not competing only on number of features.

We are competing on:

# COHERENCE.

Invitation matches website.

Website matches RSVP.

RSVP matches confirmation.

Confirmation matches messages.

Messages match wedding pass.

Wedding pass matches gallery.

Everything feels authored.

---

# 94. THE CORE DESIGN INSIGHT

Never treat:

design

and

functionality

as two separate layers thrown together at the end.

Design how functionality is experienced.

Examples:

RSVP is a scene.

Directions are a scene.

Meal choice is a scene.

Travel is a scene.

Photo uploads are a scene.

Loading is a scene.

Confirmation is a scene.

The practical information is part of the storytelling.

---

# 95. DEFINITION OF DONE

Do not declare success until the following are true.

## APPLICATION

The project installs.

The development environment runs.

No critical console errors.

Database schema/migrations exist.

Authentication works.

Primary routes work.

A couple can create a wedding.

A couple can configure events.

A couple can add/import guests.

A couple can configure RSVP.

A personalized guest can open invitation.

A guest only sees authorized events.

A guest can RSVP.

Responses persist.

Couple dashboard updates.

Guest can update response if permitted.

CSV export works.

Messaging architecture exists.

Travel/accommodation content works.

Seating works.

Photo upload works.

Collaborator/planner architecture works.

Privacy controls work.

At least English/Spanish architecture is proven.

---

## DESIGN

Marketing site is premium.

Guest experience is genuinely immersive.

At least six design-world foundations exist.

At least three strong demo experiences exist.

Mobile is excellent.

Desktop is excellent.

No major page looks like default component-library UI.

No obvious generic AI SaaS aesthetic.

Loading/error/empty states are styled.

RSVP belongs to the wedding world.

---

## ENGINEERING

TypeScript strict errors resolved.

Linting resolved.

Tests run.

Important unit/integration tests pass.

Primary Playwright flows pass.

No obvious security exposures.

Images optimized.

Responsive testing completed.

Reduced motion tested.

Keyboard navigation checked.

---

## CONTENT

No Lorem Ipsum.

No fake reviews.

No fake customer metrics.

No broken buttons.

No meaningless links.

No “coming soon” on core V1 features unless an unavoidable external service credential is the only blocker.

---

# 96. EXTERNAL SERVICE CREDENTIALS

If an external credential is unavailable:

DO NOT abandon the feature.

Build the integration architecture.

Create clean adapters.

Provide an explicit development fallback where safe.

Document exactly which environment variables activate production behavior.

Examples:

email provider
SMS provider
Stripe
custom domain API

The local/dev app should remain testable.

---

# 97. ENVIRONMENT

Create:

`.env.example`

with every required variable.

Never commit secrets.

Provide setup documentation.

---

# 98. README

Write a strong README including:

* product summary
* architecture
* setup
* database
* environment variables
* scripts
* deployment
* email/SMS configuration
* storage
* Stripe
* custom domains
* testing
* demo accounts/data
* design-system structure

---

# 99. FINAL REVIEW

Before finishing, perform a final visual audit.

Ask:

Does Vow Motion feel like software built for weddings?

That is not enough.

Ask:

Does Vow Motion feel like a world-class creative product that happens to solve wedding logistics extraordinarily well?

Then fix the difference.

---

# 100. MOST IMPORTANT PRINCIPLE

The wedding guest should never think:

> This is a nice website template.

They should think:

> I've never received a wedding invitation like this before.

The couple should never think:

> Now I need another tool to manage that.

They should think:

> Everything is here.

The planner should never think:

> This is another tool I have to manage.

They should think:

> This removes work from every wedding I run.

---

# BEGIN

Start now.

1. Inspect the available repository and tools.
2. Research only where useful.
3. Establish the product architecture.
4. Establish the visual system and brand.
5. Create the core data model.
6. Build the application.
7. Create the marketing experience.
8. Build Couple Studio.
9. Build the guest experience.
10. Build the first design worlds.
11. Implement real guest/RSVP/event flows.
12. Seed realistic demos.
13. Run the application.
14. Test it.
15. Inspect screenshots.
16. Critique visual quality.
17. Iterate.
18. Repeat until launch quality.

Do not spend the response describing what you intend to do when you have tools that allow you to do it.

USE THE TOOLS.

WRITE THE CODE.

CREATE THE DESIGN.

RUN IT.

TEST IT.

IMPROVE IT.

SHIP THE STRONGEST COMPLETE FIRST VERSION YOU CAN PRODUCE.

The visual identity, emotional experience, interaction design and coherence are as important as technical correctness.

No boring sections.

No generic templates.

No generic SaaS.

No disconnected functionality.

# Build Vow Motion as a wedding experience platform people remember.
