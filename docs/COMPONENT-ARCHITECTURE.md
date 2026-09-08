# Component architecture

The internal refactor preserves the rendered markup, styling, URLs, copy and form interactions. The planner pilot features are a separate, previously requested change documented in `PLANNER-PILOT.md`.

## Studio

`src/components/studio.tsx` owns the application shell, wedding selection, mobile navigation and notifications. `studio/use-studio-data.ts` owns wedding-scoped loading, refresh and mutation requests. `studio/navigation.tsx` pairs each navigation item with its panel, so the sidebar and page selection use the same registry.

Each workflow lives in `src/components/studio/`: guests, CSV import, events, RSVPs, experience, messages, seating, travel, photos, collaborators, settings, guest questions, invitations, overview and insights. `studio/shared.tsx` provides the panel contract, heading and household preview. Panels import this shared module rather than importing the application shell, avoiding the previous circular dependencies.

`studio-guests.tsx` and `studio-tools.tsx` retain their existing export names as compatibility entry points. New workflow code belongs in the focused modules. Setup, action lists and pilot feedback remain in `studio-pilot.tsx` and reuse those same panels.

## Guest invitation

`guest-experience.tsx` coordinates the invitation, navigation and ceremony. `src/components/guest/` contains the RSVP, photo-upload and contact-editing dialogs and shared English/Spanish copy. Each dialog owns its existing state and submission behavior; the parent passes household data and completion callbacks.

The refactor does not add a state-management dependency or change API payloads, permission checks, database behavior or visual design. Existing browser tests exercise the component boundaries through actual workflows.

Shared submit/demo controls, invitation openings and the marketing menu use `use-hydrated.ts` to remain disabled until their client handlers are ready. This prevents early clicks from being lost during page startup. Keyboard tests wait for the enabled state before moving focus; they retain the same focus-restoration assertions.
