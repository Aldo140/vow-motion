# Photo customization master plan

Status: initial personalization release implemented. The later conveniences in Phase 3 remain a separate follow-on, except for the optional arrangement suggestion included here.

## Implemented release

- Design, Photos, Personal details and Preview share one server-backed design draft. Earlier browser-only experience and identity drafts can be recovered.
- Four optional placements use wedding-owned private assets, with centered defaults, phone/desktop focal points, per-world framing, whole-photo fit, restoration and undo.
- The editor has a desktop preview beside its controls, a scaled desktop/phone review, and direct Change photo controls on the main invitation and venue preview.
- Uploads are prepared sequentially to limit mobile memory, report individual progress, support retries and replacement, deduplicate within a wedding, and enforce 50-photo/250 MB storage quotas. JPG, PNG and WebP are supported. HEIC requires JPEG export; HEIC conversion is not advertised.
- The saved source is a metadata-stripped normalized WebP, with a separate 2400px display derivative. Large inputs may be resized in the browser before upload. Users are told to keep their original files.
- Three-way draft merging preserves independent changes; conflicting choices require review. Atomic design publication preserves privacy, lifecycle, guest links, events, RSVPs and delivery records.
- Both openings, hero, story, keepsake, programme, travel, reply, memories accent, wedding pass, public wedding story and Studio preview use the shared photo resolver. Marketing illustrations remain separate.
- Current saved draft and published asset references prevent deletion. Older published revisions are not retained as separate historical snapshots; unused uploaded assets remain available for reassignment until deliberately deleted.
- Existing wedding setup still owns first publication. Applying a design to a draft wedding does not publish that wedding.

Validation: unit coverage for draft merging, conflicts and world framing; browser coverage for upload, private draft isolation, cross-wedding denial, invalid images, protected deletion, autosave/reload, publication invariants and all six worlds with both openings. Existing setup and invitation tests were updated for review-before-apply and passed. Physical iPhone HEIC conversion and the later contribution/reusable-library workflows are not claimed as tested or shipped.

## Product contract

Bring your photos. The design takes care of the arrangement.

- A couple can finish without uploading anything.
- One personal photo is enough; no minimum collection or mandatory empty slots.
- The editor uses plain words, immediate previews, and one primary next action.
- The curated layouts, typography, ornaments, and spacing remain responsible for visual quality.
- No edit sends invitations, publishes a draft, changes RSVP responses, or changes guest access implicitly.
- No new top-level navigation item. Design photos live inside Your experience. Photos & memories remains the guest gallery.

## Current foundation and gaps

Verified in the repository:
- ExperienceManager selects worlds, opening style, and story and forwards local edits to previews.
- IdentityEditor supports typography, accent, monogram, and one image-position value.
- LiveInvitation is a separate compact preview, not the complete guest renderer.
- useDraft stores drafts in localStorage under account/wedding-specific keys. It does not provide cross-device recovery.
- Existing guest uploads use preparePhoto, server-side Sharp processing, and private photo storage.
- Current photo records represent household-submitted memories, with approval controls.
- Opening, hero, travel, reply, and other guest components reference world images or fixed image paths separately.
- Existing collaborator roles are owner, partner, planner, and viewer.
- Publishing currently belongs to wedding settings. A published-design revision system must be added, not assumed to exist.

## Information architecture

Your experience contains four sections: Design, Photos, Personal details, Preview.
These are editor sections, not another setup wizard. Preserve the existing opening and story controls.

On desktop, editing controls sit beside the actual design preview. On mobile, Edit and Preview are explicit views; returning to Edit restores the previous control and scroll position.

Photos contains:
1. Add photos: phone library, files, or desktop drop zone.
2. The selected wedding's uploaded design photos, including unassigned uploads.
3. A short list of placements, each showing its current thumbnail and human name.

An image can also be edited through a clearly labeled Change photo control in an editor-only preview overlay. Hover is never required. Opening that control selects the same placement in Photos.

## Placements and defaults

| User-facing placement | Default meaning | Suggested reuse |
| --- | --- | --- |
| Your invitation | Couple photo or chosen opening scene | Opening and main invitation, shown explicitly |
| Your story | Couple or personal memory | Story photograph |
| Your venue | Real destination or venue | Travel postcard and selected venue artwork |
| Little details | Rings, flowers, meaningful object | Programme and reply accents |

The same asset can have independent crops in different placements. Reuse is explicit; never automatically put a couple portrait into travel information.

Each world defines default assets, supported placements, aspect ratios, and visual treatments. Decorative ribbons, crests, paper, and botanical artwork remain curated.

When a photo is absent, show the world default. An optional section that is disabled remains disabled even when a photo is uploaded. A library image must not be captioned as the couple's actual venue unless that association is supplied by the user.

## Primary journeys

| Entry / situation | Flow | Completion / escape |
| --- | --- | --- |
| New couple, no photos | Choose world; optional Add your photos | Keep this look continues immediately |
| New couple, one photo | Upload; choose its role; preview suggested placement | Use photo; remaining placements keep defaults |
| Couple with several photos | Batch upload; browse thumbnails; assign roles individually | Use selected photos; unassigned assets stay available |
| User taps a preview image | Change photo opens that placement | Choose uploaded photo, upload new, or use original artwork |
| User enters through Photos | Select placement and asset | Preview jumps to the affected section |
| Returning to an unfinished wedding | Recover latest saved server draft | Continue where they left off; distinguish local unsynced work |
| Changing a live wedding | Edit a separate design draft | Preview; Update live invitation; existing guest link stays the same |
| Switching world or opening | Reapply compatible photo roles to new presentation | Preserve assets and old crop choices; allow immediate undo |
| Planner managing several weddings | Open a wedding, then its design library | Name the wedding throughout; no cross-wedding asset exposure |
| Partner or planner collaborating | Use existing authorized wedding access | Show revision conflicts instead of overwriting another person's work |
| Viewer | View and preview allowed content | No upload, replacement, deletion, or publication controls |
| Guest | Open published invitation normally | No design controls; gallery uploads remain a separate workflow |
| Public demo | Keep existing sample experience | Create your wedding before persistent personal uploads in initial release |
| Archived / memories wedding | Follow existing edit permissions and lifecycle | Never silently reopen RSVPs or replace memory uploads |

## Upload and assignment behavior

1. Open the native file picker; cancellation returns without a change.
2. Show each selected thumbnail immediately with Uploading, Processing, Ready, or Needs attention.
3. Resize and normalize supported inputs automatically. Keep safe originals and generate display derivatives; never promise recoverable originals unless stored.
4. Validate file contents, dimensions, orientation, size, and wedding ownership server-side. Remove unnecessary location metadata from delivered derivatives.
5. A bad file fails individually; successful files remain usable. Provide Retry or Choose another photo beside the failed file.
6. Do not show an image as saved until storage and asset metadata are both confirmed.
7. A duplicate upload within the same wedding offers the existing asset rather than silently adding copies. No cross-wedding deduplication exposure.
8. Starting from Change photo preselects the placement. Starting from Add photos requests the role only when assigning, not before upload.
9. If an assigned photo appears in multiple places, show affected thumbnails and offer This place or All linked places. Default to the place they entered from.
10. Make HEIC/HEIF handling an explicit implementation spike. Prefer supported conversion; if unavailable, explain the remedy before discarding work. Do not advertise support before device testing.

## Crop and visual quality

- Start with a centered crop; allow a tap or drag to set a two-dimensional focal point.
- Provide a portrait and wide preview together; label them Phone and Desktop.
- Preserve the original asset. Crops and zoom are metadata, not destructive rewrites.
- Offer Show whole photo using a coordinated paper mount when cropping would cut out people.
- Advanced controls, including separate phone and desktop crop overrides, remain behind Adjust framing.
- Provide keyboard controls and Reset framing; gesture-only cropping is insufficient.
- Keep existing text contrast treatments. If a picture does not work behind text, use a supported framed-photo layout rather than repeatedly asking the user to fix it.
- Low resolution is a recoverable quality warning with Keep photo and Choose another. Corrupt or unsafe files are blocked.
- No face recognition or inferred roles are required for the first release. Smart suggestions later must be optional and reversible.

## Draft, preview, and publication states

| State | Visible status | Primary action |
| --- | --- | --- |
| Unchanged | All changes saved | Preview invitation |
| Editing / syncing | Saving your changes | Preview available with local draft |
| Server draft saved | Draft saved; guests still see the current version | Preview changes |
| Upload unfinished | Photos still uploading | Finish upload; existing live design remains intact |
| Publish ready | Review your updated invitation | Publish invitation / Update live invitation |
| Published | Your invitation is up to date | View live invitation |
| Offline / sync failed | Changes are on this device; not saved online | Retry saving |
| Concurrent revision | This wedding was updated elsewhere | Review both versions |

Publication is atomic: publish references only ready assets and a valid design revision. A failed update preserves the prior live revision. Updating images does not email or message anyone.

For first publication, retain the existing wedding readiness requirements rather than inventing another checklist. For an already live wedding, publish just the reviewed design revision; do not accidentally bundle unrelated event or access changes.

Preview uses the same media resolution rules and image components as the guest route. Authorized household preview remains responsible for household event visibility. Never display real private household details in an unauthenticated design preview.

## Recovery and destructive actions

| Situation | Required behavior |
| --- | --- |
| Switch tab, reload, close editor | Saved server draft restores; local unsynced state is identified separately |
| Browser closes during upload | Preserve confirmed assets; interrupted file requires retry or reselection, with an honest status |
| Upload completes out of order | Associate results with stable local upload IDs, never list position |
| Select another photo before upload finishes | Old upload may finish in the library but cannot replace the new choice |
| Slow connection | Show progress; keep existing preview until replacement is ready |
| Publish during upload | Explain which assigned asset is unfinished; never publish broken placeholders |
| Remove from a placement | Restore template artwork in the draft; keep file in library; offer Undo |
| Delete an unused library file | Confirm deletion; remove stored asset and derivatives safely |
| Delete a file used by a draft or live version | Show usage and require replacement/removal first; protect historical revisions under the retention policy |
| Switch world and return | Restore the user's previous per-world framing where available |
| Two editors change different fields | Merge nonconflicting revision updates |
| Two editors change the same placement | Ask which change to keep; never silently last-write-wins |
| Permission revoked mid-edit | Stop mutations and publication; do not expose assets after access ends |
| Storage quota reached | Explain limit and available actions before repeated uploads; do not silently compress quality further |
| Asset unavailable | Deliver safe template fallback; expose a repair notice to authorized editors |

Local persistence cannot guarantee recovery after browser data is cleared. Server-confirmed assets and drafts can. Do not use reassuring copy that overstates this boundary.

## Collaboration and privacy

Initial release reuses existing owner, partner, planner, and viewer permissions, verified on every server mutation. Do not add a new approval hierarchy implicitly. If separate Publish permission is introduced, define migration defaults explicitly.

Design assets are wedding-owned and distinct from guest memories. Choosing a guest memory for design must be a deliberate authorized action, not automatic reuse. Keep that capability out of the first release unless approval and asset-use semantics are implemented together.

Later: a scoped couple contribution link can allow uploads without full Studio access. It must not grant access to guest lists, existing private images, or publishing. Expiry, revocation, quotas, and uploader attribution are prerequisites.

## Implementation boundaries

1. Create a typed design-asset model with wedding ownership, processing state, dimensions, storage references, and lifecycle metadata.
2. Create a versioned placement map with defaults, asset references, focal point, fit, and optional viewport crops.
3. Centralize world-to-placement defaults and a shared resolveWeddingMedia function; prohibit new hardcoded guest content images outside these defaults.
4. Extend storage helpers and authenticated upload/read/delete endpoints for design assets. Decide upload transport based on deployment limits; test large phone files before promising batch behavior.
5. Add server-backed design drafts, revision checks, and atomic publication while retaining scoped local recovery.
6. Replace image resolution consistently in both openings, hero, story, travel, programme accents, reply, and Studio previews.
7. Add editor controls and per-placement previews. Consolidate conflicting save controls into one design-draft state, while preserving unrelated wedding settings behavior.
8. Keep marketing illustrations and public sample assets separate from personal wedding assets.
9. Deliver appropriately sized images and lazy-load secondary scenes. Design asset URLs must follow the wedding's existing access model, including any intentional pre-opening imagery.

## Delivery sequence

Phase 1: foundation and one complete path. Upload one invitation photo, preview it in both openings and the guest hero, frame it on mobile/desktop, save draft, publish, and restore the original. Migrate existing weddings to default references without visual changes.

Phase 2: complete initial release. Add story, venue, and detail placements; batch upload; usage-aware replacement/removal; world switching; collaboration conflict handling; all guest surfaces; cross-device restoration; robust error recovery.

Phase 3: conveniences after the core is reliable. Suggested arrangement, reusable planner assets with explicit copy permissions, contribution links, approved-memory reuse, and side-by-side design comparisons.

The phase-one vertical slice is for validation, not permission to ship a partially inconsistent photo system.

## Release acceptance matrix

- All six worlds x both openings x default, single-photo, and multi-photo configurations.
- Mobile at 320, 390, and 430px; tablet; desktop at 1440 and 1920px; ultrawide spot check.
- Portrait, landscape, square, transparent, rotated, low-resolution, corrupt, oversized, duplicate, and unsupported-format inputs.
- Default content, long names, English/Spanish, reduced motion, keyboard-only navigation, and zoom.
- Owner, partner, planner, viewer, unauthorized user, guest, and revoked session.
- Draft, published, and memories weddings; switching worlds and opening types; existing guest links.
- Slow upload, one failed batch item, refresh, navigation away, offline recovery, two-device edits, and simultaneous publication.
- Verify no unapproved changes reach guests, no invitation sends occur, no cross-wedding access is possible, and no RSVP/event data changes.
- Verify no clipped people after user framing, unreadable image-overlay text, broken photos, horizontal page overflow, or preview/live mismatch.

## Success criteria

Measure time from opening Photos to first successful personalized preview, upload completion and retry rates, crop corrections, abandonment, successful draft recovery, and publication success. Establish the baseline before setting numeric targets.

Usability check: someone unfamiliar with Studio should be able to add one photo, find where it appears, adjust its phone crop, and understand whether guests can see it without explanation from us.
