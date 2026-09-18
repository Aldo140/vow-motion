# Legal and compliance checklist

This is a checklist of facts and decisions only the operator can supply —
no code change can complete it. `/privacy` reads the `OPERATOR_*` environment
variables (see `.env.example`) and states plainly when they are unset; it
never invents or assumes an answer on the operator's behalf.

Nothing here is legal advice. Have qualified counsel review the final
wording before accepting real guest data as a public service.

## 1. Identity (blocks everything else)

- [x] Jurisdiction confirmed: Alberta, Canada. Set in `.env.local` as
      `OPERATOR_JURISDICTION=Alberta, Canada` (local dev only — see below).
- [x] Privacy contact confirmed: jorti104@mtroyal.ca. Set as
      `OPERATOR_PRIVACY_CONTACT`.
- [ ] **Still needed: the registered business name** for
      `OPERATOR_LEGAL_NAME`, and the registered address for
      `OPERATOR_ADDRESS`. `/privacy` will keep saying identity is
      unconfigured until all three of legal name, jurisdiction, and privacy
      contact are set — that's deliberate, so it never shows a
      two-thirds-complete identity as if it were whole.
- [ ] **Set these in the production environment, not just `.env.local`.**
      What's in `.env.local` only affects your local dev server; the live
      site at whatever Vercel project hosts this needs the same
      `OPERATOR_*` variables added in its environment settings before
      `/privacy` reflects them for real visitors.

## 1a. Serving US clients alongside Canadian ones

You said you want to work with both US and Canadian clients. That changes
the compliance surface beyond what the original review (Alberta-only)
assumed:

- [ ] Decide whether any US clients are California residents (or other
      states with their own privacy statutes — Virginia, Colorado,
      Connecticut, Utah as of this writing) — CCPA/CPRA-style rights
      (access, deletion, opt-out of "sale/sharing") may apply on top of
      PIPA/PIPEDA, not instead of it.
- [ ] Decide whether US clients' payment/billing needs a US-side entity or
      can run through the Alberta one — a tax/accounting question, not one
      this repo can answer.
- [ ] Confirm whether hosting (database, blob storage, email/SMS provider)
      keeps US client data in a specific region if any contract or
      state law requires it — infrastructure regions are set in the
      deployment platform, not in this repo's code.
- [ ] CASL (Canada's anti-spam law, section 3 below) still applies to any
      message sent from this Canadian-operated business, regardless of
      where the recipient lives — it's about the sender's jurisdiction, not
      only the recipient's.

## 2. Privacy law (Alberta PIPA / PIPEDA, per `docs/PROJECT-REVIEW.md`)

- [ ] Name the accountable individual for privacy compliance (PIPA requires
      this).
- [ ] Document actual purposes and retention periods per data category —
      the code's *current* retention behavior is recorded in
      `src/lib/account-deletion.ts` and the worker's cleanup pass
      (`src/app/api/worker/route.ts`), not decided by this checklist.
- [ ] Confirm real hosting/provider regions (database, file storage, email,
      SMS) — do not publish a data-residency claim the infrastructure
      doesn't actually match.
- [ ] Establish a breach notification procedure: who is told, how fast, and
      through what channel.
- [ ] Decide how a guest or couple's access/correction/deletion request
      reaches a human, beyond the self-service tools already built
      (Studio → Settings → Privacy centre; guests editing their own RSVP).

## 3. Commercial messaging (CASL)

- [ ] Classify which messages are transactional (invitations, RSVP
      confirmations) versus commercial (marketing) — see
      `scripts/audit-outreach-copy.mjs` for the existing outreach-copy
      guardrails.
- [ ] Confirm sender identification and unsubscribe wording meet CASL's
      specific requirements, not just "has an unsubscribe link."
- [ ] Keep evidence of consent (not just the `consent` boolean already
      stored) — wording shown, timestamp, and collection method.

## 4. Terms, ownership, and IP

- [ ] Publish terms of service, a cancellation/refund policy, and a photo/
      content permissions policy before charging for the product.
- [ ] Confirm trademark status before keeping the registered-mark symbol in
      `src/components/ui.tsx` and the ad composition — this review found no
      registration evidence, which does not mean one doesn't exist.
- [ ] Confirm rights to any reference imagery under `images inspo/` before
      using it publicly; see `docs/ASSETS.md` for what's already tracked.

## 5. Security and accessibility posture (evidence, not certification)

- [ ] Map applicable controls against OWASP ASVS (Level 2 proposed as the
      target in `docs/PROJECT-REVIEW.md`) — this codebase has not been
      through a formal ASVS assessment.
- [ ] `scripts/audit-accessibility.mjs` and `scripts/audit-keyboard.mjs` run
      an automated WCAG 2.1 AA pass plus a manual keyboard-focus check
      across the core screens — rerun them after UI changes. Passing these
      is evidence toward WCAG conformance, not a conformance claim by
      itself; a full manual audit (screen readers, real assistive tech,
      every screen) has not been done.

## Where this stands today

`/privacy` already states honestly whether section 1 is configured. Sections
2–5 are operator decisions and paperwork; this repository can enforce the
technical side (retention code, consent storage, contrast, keyboard access)
but cannot write the legal documents or make the jurisdiction call.
