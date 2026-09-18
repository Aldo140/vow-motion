# Legal and compliance checklist

This is a checklist of facts and decisions only the operator can supply —
no code change can complete it. `/privacy` reads the `OPERATOR_*` environment
variables (see `.env.example`) and states plainly when they are unset; it
never invents or assumes an answer on the operator's behalf.

Nothing here is legal advice. Have qualified counsel review the final
wording before accepting real guest data as a public service.

## 1. Identity (blocks everything else)

- [ ] Confirm the legal entity operating this deployment (sole proprietor,
      corporation, etc.) and its registered address.
- [ ] Confirm the jurisdiction(s) whose law applies — where the business is
      registered, and where its guests/couples are located.
- [ ] Set `OPERATOR_LEGAL_NAME`, `OPERATOR_JURISDICTION`, `OPERATOR_ADDRESS`,
      `OPERATOR_PRIVACY_CONTACT` in the production environment. `/privacy`
      will start showing them automatically once set.

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
