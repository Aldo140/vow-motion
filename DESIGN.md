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
