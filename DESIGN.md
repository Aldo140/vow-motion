# Vow Motion visual system

A gallery in afternoon light: printed invitation specimens, generous margins, architectural photography, and sharp typography. The brief explicitly asks for ivory/bone, ink, and restrained accents; those instructions take precedence over randomized skill palette suggestions.

Platform: near-white ivory, true ink, olive for active Studio controls. Manrope utility text; Bodoni Moda display recalls high-contrast fashion mastheads. Brand voice: printed, spacious, intimate. No rounded decorative card grids.

Worlds: Riviera (blue, travel journal, Italiana), Maison (ivory, fashion spreads, Bodoni), Notte (black, champagne, cinematic), Heritage (formal, engraved rules, Libre Baskerville), Modernist (cobalt, geometry, Manrope), Garden (botanical greens, layered photography, organic framing).

Spacing: 4/8/12/16/24/32/48/64/96. Controls 44px minimum, 6px radius. Content max 1440px. UI motion 180ms; guest reveal 700ms; prefers-reduced-motion disables transforms. Sidebar becomes a mobile navigation drawer. Native dialog for modal focus management.

## Wedding surface refinement

Landing and guest pages use the ceremony and its physical objects as the visual reference: candlelit tables, roses, silk ribbon, cotton invitation paper, and engraved monograms. Original generated photographs live at `public/images/wedding-evening.webp` and `public/images/wedding-details.webp`; they illustrate the collections rather than document customer weddings. The two assets total under 350 KB.

`celebration.css` owns the marketing art direction. `invitation.css` owns the guest composition, using the original image-led invitation as its foundation. Desktop layers a wide photograph, names, a calendar keepsake, a medallion and a floral photograph. Mobile has its own asymmetric name lockup, taller photograph and paired keepsakes below the picture. Story photographs flank the letter on desktop and form an album pair below it on mobile. Travel uses stacked postcards; RSVP uses overlapping reply cards.

Motion follows the physical layers: a 480 ms stationery opening, independent scroll parallax, a subtle desktop pointer tilt, and a reply-card entrance. Mobile reduces the travel distance; reduced motion disables the motion, retaining the full composition and all controls. The date keepsake downloads the guest’s authorized calendar; the existing RSVP/pass dock stays reachable. All six worlds retain their typography, palette and distinctive framing.

## Landing hero: the living invitation suite

`landing-hero.tsx` and `landing-hero.css` compose three physical layers over atmospheric reception photography: a venue print, floral keepsake, and working sealed invitation. Opening the seal reveals a keyboard-accessible link into the selected wedding. Riviera, Maison and Notte controls change the paper, photography, typography, couple and destination together. Escape closes the sample and returns focus to the seal.

Desktop uses a short sticky stage with independent scroll depth and pointer tilt. Mobile uses natural scrolling, a smaller stage, shorter parallax travel and full touch targets. Reduced motion removes pinning and animation while retaining the complete layout and interactions. Hero-only venue derivatives are optimized WebP files; the existing guest experience and its styling stay separate. The collection preview, introductory monogram and closing invitation use smaller, scoped motion details.

Mobile marketing navigation uses an ivory menu sheet over a dimmed backdrop. Large serif links, a persistent start action and sign-in remain reachable; only the links scroll on short screens. A native modal dialog isolates background interaction, with explicit focus cycling, Escape/backdrop dismissal, scroll restoration and automatic cleanup when switching to desktop. Selecting a section transfers focus to its destination. Touch opening uses a 220 ms entrance; keyboard and reduced-motion opening are immediate.
