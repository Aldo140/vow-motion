# Vow Motion visual system

A gallery in afternoon light: printed invitation specimens, generous margins, architectural photography, and sharp typography. The brief explicitly asks for ivory/bone, ink, and restrained accents; those instructions take precedence over randomized skill palette suggestions.

Platform: near-white ivory, true ink, olive for active Studio controls. Manrope utility text; Bodoni Moda display recalls high-contrast fashion mastheads. Brand voice: printed, spacious, intimate. No rounded decorative card grids.

Worlds: Riviera (blue, travel journal, Italiana), Maison (ivory, fashion spreads, Bodoni), Notte (black, champagne, cinematic), Heritage (formal, engraved rules, Libre Baskerville), Modernist (cobalt, geometry, Manrope), Garden (botanical greens, layered photography, organic framing).

Spacing: 4/8/12/16/24/32/48/64/96. Controls 44px minimum, 6px radius. Content max 1440px. UI motion 180ms; guest reveal 700ms; prefers-reduced-motion disables transforms. Sidebar becomes a mobile navigation drawer. Native dialog for modal focus management.

## Wedding surface refinement

Landing and guest pages use the ceremony and its physical objects as the visual reference: candlelit tables, roses, silk ribbon, cotton invitation paper, and engraved monograms. Original generated photographs live at `public/images/wedding-evening.webp` and `public/images/wedding-details.webp`; they illustrate the collections rather than document customer weddings. The two assets total under 350 KB.

`celebration.css` owns the marketing art direction. `invitation.css` owns the guest composition, using the original image-led invitation as its foundation. Desktop layers a wide photograph, names, a calendar keepsake, a medallion and a floral photograph. Mobile has its own asymmetric name lockup, taller photograph and paired keepsakes below the picture. Story photographs flank the letter on desktop and form an album pair below it on mobile. Travel uses stacked postcards; RSVP uses overlapping reply cards.

Motion follows the physical layers: a 680 ms envelope opening, independent scroll parallax, a subtle desktop pointer tilt, and a reply-card entrance. Mobile reduces the travel distance; reduced motion disables the motion, retaining the full composition and all controls. The date keepsake downloads the guest’s authorized calendar; the existing RSVP/pass dock stays reachable. All six worlds retain their typography, palette and distinctive framing.

## Landing hero: the living invitation suite

`landing-hero.tsx` and `landing-hero.css` compose three physical layers over atmospheric reception photography: a venue print, floral keepsake, and working sealed invitation. Opening the seal reveals a keyboard-accessible link into the selected wedding. Riviera, Maison and Notte controls change the paper, photography, typography, couple and destination together. Escape closes the sample and returns focus to the seal.

Desktop uses a short sticky stage with independent scroll depth and pointer tilt. Mobile uses natural scrolling, a smaller stage, shorter parallax travel and full touch targets. Reduced motion removes pinning and animation while retaining the complete layout and interactions. Hero-only venue derivatives are optimized WebP files; the existing guest experience and its styling stay separate. The collection preview, introductory monogram and closing invitation use smaller, scoped motion details.

Mobile marketing navigation uses an ivory menu sheet over a dimmed backdrop. Large serif links, a persistent start action and sign-in remain reachable; only the links scroll on short screens. A native modal dialog isolates background interaction, with explicit focus cycling, Escape/backdrop dismissal, scroll restoration and automatic cleanup when switching to desktop. Selecting a section transfers focus to its destination. Touch opening uses a 220 ms entrance; keyboard and reduced-motion opening are immediate.

## Guest invitation: a useful keepsake

The guest refinement preserves the approved photographic hero and six world identities. Design variance 8, motion 7, density 3: expressive physical layers around an uncluttered guest flow. `guest-keepsakes.css` owns the new objects; `invitation.css` remains the underlying composition.

The opening pairs a venue photograph with a personalized folded envelope. The seal releases, the flap lifts, and the letter slides out before the invitation appears. Pointer tilt is confined to fine pointers; keyboard and reduced-motion opening are immediate. The floral keepsake turns over to show the earliest authorized event with its local time, date, venue and a link to the plans. Only the visible face is interactive and exposed to assistive technology.

The wedding pass uses a ticket composition with a private QR code, household names, table assignments and a chronological itinerary. Every event includes its local date and time zone, dress code and direct directions. Guest dialogs retain a visible close control while scrolling, lock the background and restore the original scroll position. The empty memory album is a working photo-upload invitation. All guest additions support English and Spanish.

## Guest invitation: the personal suite

`guest-invitation-hero.tsx` and `guest-atelier.css` elevate the photographic composition with a complete name card, a tinted backing sheet, an isolated silk ribbon, a venue print and the existing functional keepsakes. The desktop invitation rests beside and across the landscape photograph. On a phone, the letter sits above a portrait print; its backing sheet follows the letter's content height, including long names. Heritage and Garden retain their serif proportions and framing; Modernist keeps straight edges and omits the silk. The guest's name also addresses the love letter, with reception imagery giving the story its own photographic moment.

Each material has a different motion: the paper settles sideways, the image moves in depth, the backing sheet turns slightly, and the ribbon trails more slowly with scroll. All transforms are scoped to the invitation and cleaned up on replay. Reduced motion retains static layers. The envelope replay action restores focus to its seal and scrolls to the opening; opening again focuses the names. Returning visits still go straight to the invitation. Invisible decoration never intercepts a guest action.

Decorative asset: `public/images/invitation-silk.webp`, 620 × 930, approximately 89 KB, with alpha transparency. Generated using the built-in image generation tool and optimized with Sharp; it represents invitation styling, not a customer's wedding photograph. Source remains in the generated-images directory.

Generation prompt: “Create one production-ready photorealistic isolated object asset for a luxury wedding invitation website. A single hand-tied narrow ivory silk ribbon bow with irregular soft loops, delicate frayed raw edges, and two very long naturally curling ribbon tails. The bow knot sits in the upper third, one tail curls left down and then right, the other falls down in a long graceful S-shaped curve. Shot from directly above, realistic couture styling, matte silk with fine visible fibers and subtle directional daylight highlights, refined natural shadow within the folds, warm porcelain ivory color. The silhouette must be light and airy with large transparent negative spaces between tails. Object fills about 85% of a portrait 1024x1536 canvas. TRUE TRANSPARENT ALPHA background, no solid white or checkerboard background, no floor or surface, no text, no invitation, no flowers, no border, no extra objects. Keep all ribbon ends fully inside the canvas. This is an isolated cutout asset, not a website mockup. Save the image to a local file if supported.”

The floating guest dock overlays the bottom of the viewport, so the invitation holds its keepsakes above it: the save-the-date's calendar action stays tappable where the composition first comes to rest, without scrolling. On a desktop print the venue caption sits in the clear band between the two keepsakes; on a phone both keepsakes rest on that strip, so the caption keeps its spacing and drops its text, which the letter above already carries.

The dock is fixed to the foot of the viewport while the invitation sits at a fixed place in the document, so for a narrow band of window heights the two still meet. No fixed clearance removes that; it only moves which heights are affected. What holds at every height, and is tested, is that a small scroll frees the action, and the same calendar download sits inside the wedding pass the dock itself opens.

## The planner page

`/planners` argues the case that the homepage cannot: the couple sees a celebration, the planner sees a plan. Its signature is a ledger whose every row pairs something the planner sets in the Studio with what the couple's guests meet because of it, so the correspondence is the structure rather than a claim. The planner half stays in the working face and the guest half in the invitation's italic olive, divided by a spine marked once per row. On a phone the pair stacks and each half names its side, because the columns no longer can. Nothing here introduces a colour or a face the wedding surfaces do not already use.

## The ceremonial layer

Three things recur across the reference material this direction was drawn from, and the invitation had none of them: an engraved crest, the day set out as an order of service, and the wait counted down.

`guest-crest.tsx` draws an oval cartouche in hairlines, holding the couple's initials. It is line art rather than an image, so it takes the world's ink, scales without an asset, and works for any pair of initials. Modernist keeps the proportions and drops the ornament, which is the same decision that world already makes about the silk. When motion is welcome the crest draws itself once as the order of the day arrives, outer oval first, then the ornament, then the initials settle; under reduced motion it is simply there, complete.

The programme is now an order of service. Moments group under the day they fall on, resolved in the venue's timezone rather than the reader's, so a destination weekend reads as Friday, Saturday, Sunday instead of one flat list. A hairline runs the length of each day, every moment is marked on it with a glyph matched to the kind of moment it is, and the time sits in a struck chip beside it. The glyph is matched on the words couples actually use, in both languages, and falls back rather than guessing wrongly.

The countdown closes the weekend. Figures are set in the serif at display size with tabular numerals so the digits do not jostle as they tick; on a phone the four pair up two by two rather than shrinking to fit. The ticking figures are hidden from assistive technology, which is given one settled sentence instead of a stream of seconds. After the day it reads as a statement rather than a clock.

Not taken from the references: an ambient soundtrack, which appears in most of them. A track cannot be licensed here, and a speaker control that plays silence is worse than no control at all.

## The reply suite and the memory album

`guest-reply-card.tsx` replaces the centred RSVP panel with a folded reply suite on an open envelope. Its coloured cover holds the existing crest and the couple's names; the addressed letter carries the household names, real reply deadline, saved-response state and one clear action. On mobile, the cover becomes a compact header above the letter. Floral photography belongs to the tabletop, not the form. The original RSVP modal and its guest permissions remain the source of truth.

`guest-memory-album.tsx` composes two facing album pages with a shaded binding. Desktop places the written invitation on the left and photographic prints on the right. Mobile reads as title, photographs, then sharing action, in the same DOM and keyboard order. The empty album pairs decorative reception photography with a working first-photo slot. Once guests upload, real authorized images replace that composition, preserving pending-review labels. Every thumbnail and the browse action open a native dialog with full-size imagery, captions, previous/next controls, arrow-key navigation and focus restoration. Additional photos remain reachable through that viewer beyond the four-print preview.

`guest-reply-album.css` scopes the new layouts across all six worlds. Existing world colours and typefaces carry through; the crest inherits the cover's contrasting ink. English and Spanish actions, 320px layouts, reduced motion, real photo upload, and private-photo viewing are checked before release.

## One invitation, from opening to arrival

The desktop suite remains the compositional reference. Mobile removes the extra medallion, draws the ribbon back to a corner, shortens the name card's margins, and gives the venue print more visible area. The opening settles the photograph and letter at different times; the smaller keepsakes arrive last. Reduced motion leaves the complete composition static.

`guest-navigation.tsx` replaces the website-style link bar with a monogram that opens the invitation's contents. A native popover handles light dismissal and Escape; section links transfer focus to their destination, and opening a dialog restores focus to the monogram on return. Replay is a quiet secondary action. The fixed controls read as a folded index slip, keeping explicit text labels and touch targets.

`guest-continuity.css` carries the same paper, ink, typography and short settling motion into RSVP and the wedding pass. The response form retains native controls and its existing draft, validation and persistence logic. Confirmation offers a direct next step into the pass, completing the contents → celebration → RSVP → pass journey without sending the guest back to search for another control.

## Two ways an invitation can arrive

A couple chooses how their invitation opens, and both choices lead to the same invitation. The crafted suite lays a photograph, a card and a lined envelope out together and unfolds across the page; the sealed envelope puts one printed envelope in the hand, closed with wax.

`guest-seal-gate.tsx` prints its paper rather than photographing it: a botanical repeat drawn as an SVG pattern in the world's own ink, so every world prints the same stationery in its own colour and Modernist prints none at all, as it carries no silk elsewhere. The envelope's height follows its content, so long names lengthen the paper instead of spilling out of a fixed shape. The wax is the only control on the page, so it carries a visible label as well as its accessible name, and the flap point sits above the card rather than across the names. The envelope is addressed on the paper itself, which is both the truer metaphor and the only place a household's names are legible over photography that is not uniformly dark.

Breaking the seal lifts and tilts the wax away, swings the flap down, and raises the card before handing over to the invitation. Reduced motion goes straight through.

The choice is a validated column rather than a loose setting, because it selects a component: an unknown value is refused by the API and by the database. In the Studio it sits under the world grid as two drawn previews, each described by what a guest does rather than by the name of a style, and it can be changed at any time.

## Six worlds that are actually six

A world was a palette and a photograph, which is how a system of worlds turns back into a set of templates. Each world now also carries a voice: the line that greets a guest at the envelope, the phrase above the names, the invitation itself, the closing note, and the mark that joins two names. Maison asks for the pleasure of your company at a very long lunch; Notte says the car is waiting; Modernist promises no speeches you have to sit through and joins its names with a plus rather than an ampersand. Every line exists in both languages, because a world that only has a voice in English is not a world.

Ornament follows the same rule. The photographic worlds print silk; Heritage and Garden print a drawn sprig instead, line art in the world's own ink rather than a second photograph; Modernist prints nothing, consistent with the crest it already strips and the envelope pattern it already omits. All three occupy the same place in the composition and inherit the same scroll motion, so only the material changes.

A regression test reads all six openings and refuses to let any two share a greeting, a kicker or an invitation line.

## The questions guests would have emailed

Every wedding answers the same handful of questions by hand: can I bring someone, what do I wear, are children invited, is there a shuttle, when must I reply. `faqs` makes them part of the invitation instead of part of the couple's inbox.

Guests meet them as an engraved index rather than a support page. The crest opens the section, the questions sit on hairlines, and a drawn cross turns into a minus as an answer appears. Only one answer is open at a time, which the native exclusive `details` grouping handles rather than any script, so it survives with JavaScript disabled and keeps keyboard behaviour the browser already provides. Spanish answers replace English ones rather than sitting beside them, and the section is reachable from the invitation's contents, which offers it only once a couple has answered something.

In the Studio the section sits under the world and the opening, because it belongs to what a guest meets. Six starters carry drafted answers, since most couples will edit a sentence and few will write one from nothing; each starter disappears once its question exists. The showcase wedding answers all six, in both languages, with the shuttle time and the reply deadline it actually holds.
