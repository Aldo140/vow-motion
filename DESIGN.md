# Vow Motion visual system

A gallery in afternoon light: printed invitation specimens, generous margins, architectural photography, and sharp typography. The brief explicitly asks for ivory/bone, ink, and restrained accents; those instructions take precedence over randomized skill palette suggestions.

Platform: near-white ivory, true ink, olive for active Studio controls. Manrope utility text; Bodoni Moda display recalls high-contrast fashion mastheads. Brand voice: printed, spacious, intimate. No rounded decorative card grids.

Worlds: Riviera (blue, travel journal, Italiana), Maison (ivory, fashion spreads, Bodoni), Notte (black, champagne, cinematic), Heritage (formal, engraved rules, Libre Baskerville), Modernist (cobalt, geometry, Manrope), Garden (botanical greens, layered photography, organic framing).

Spacing: 4/8/12/16/24/32/48/64/96. Controls 44px minimum, 6px radius. Content max 1440px. UI motion 180ms; guest reveal 700ms; prefers-reduced-motion disables transforms. Sidebar becomes a mobile navigation drawer. Native dialog for modal focus management.

## Wedding surface refinement

Landing and guest pages use the ceremony and its physical objects as the visual reference: candlelit tables, roses, silk ribbon, cotton invitation paper, and engraved monograms. Original generated photographs live at `public/images/wedding-evening.webp` and `public/images/wedding-details.webp`; they illustrate the collections rather than document customer weddings. The two assets total under 350 KB.

`celebration.css` scopes the art direction to marketing and guest surfaces. The landing opens with a photographic reception and an interactive invitation keepsake. Guest invitations arrive as layered stationery, then reveal an accessible invitation with the date and location immediately visible. Notte opens on a dark photograph; Garden uses an arched photograph; Modernist uses its cobalt field. The opening transition is 280 ms, preserves keyboard focus, and skips movement when reduced motion is requested. Planning controls retain the existing product system.
