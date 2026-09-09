# Digital invitation sending strategy

## Decision

Vow Motion should use a household-based, list-first campaign workflow: import or enter the guest list, resolve household readiness, automatically generate a private link for each selected household, send a test, then dispatch all selected invitations in one action. The system must exclude successful prior sends, expose missing addresses before sending, and retain individual link controls for WhatsApp and exceptional cases.

This combines the strongest operational patterns from Paperless Post, RSVPify, Evite, Greenvelope, and Zola while preserving Vow Motion’s household privacy model. A generic shareable link is inappropriate as the default because it loses private-event filtering, household identity, controlled plus-ones, and reliable RSVP attribution.

## Competitive evidence

### Paperless Post

Paperless Post offers the clearest complete workflow. Hosts can add recipients individually, reuse an address book or previous list, upload a spreadsheet, or paste names and addresses. The product identifies duplicates before the send. The host then uses one Send action, while the platform generates a personalized invitation link for every recipient.^1

Its tracking model preserves individual recovery. A host can copy one recipient’s personalized link, resend to a different contact method, or send a copy to themselves. Bulk follow-up is handled as a broadcast rather than by manually rebuilding invitations.^2 Paperless Post also explicitly warns that forwarding a personalized link causes replies to apply to the original recipient, which supports making household identity visible during review.^3

### RSVPify

RSVPify requires an invite list for digital invitation sending and uses it to prevent unlisted responses, control plus-ones and secondary-event access, and track opens and bounces.^4 It supports group merge tags that list all invited people in a family or party, so the email itself makes invitation scope clear.^5

For late additions, RSVPify does not rebroadcast to the original list. Newly added guests can receive a previously sent email through an Add Recipients action.^6 This is a valuable safety invariant: the default recipient set should be “ready and not successfully sent,” with explicit selection required for anything else.

### Evite

Evite presents guest acquisition and sending as one sequence: import contacts, reuse a past list, upload a spreadsheet, review, and send.^7 When adding more guests later, only the new guests receive the invitation; previously listed guests are not sent another copy.^8 The product therefore treats send history as part of recipient eligibility rather than as a report consulted after the fact.

### Greenvelope

Greenvelope exposes personalization tokens for names, custom fields, and personalized card or RSVP URLs.^9 This makes one authored message reusable across a full list. Vow Motion needs fewer visible tokens because its household and wedding data are structured; the essential tokens are household name, couple name, and private invitation link.

### Zola

Zola’s guest messaging lets hosts filter a guest list, select all, choose a bulk action, and send one message to multiple addresses.^10 Its digital save-the-date flow also provides recipient selection and a test/preview path.^11 Zola does not currently offer full digital wedding invitations, so its strongest applicable lesson is selection ergonomics rather than invitation security.^12

## Design principles

### Household is the delivery unit

Vow Motion’s authorization boundary is a household token. One token determines the named people, permitted private events, questions, plus-ones, and responses. Sending separate links to each person in a household would create conflicting reply surfaces. The campaign therefore selects households and chooses one primary address from the first named, non-plus-one guest with an email.

The review screen displays both household name and delivery address. If the address is wrong, the planner fixes the guest record before sending. A future enhancement can allow an explicit household primary contact, but implicit selection is sufficient for the current data model and avoids another setup requirement.

### Readiness before composition

The top of Invitations shows Ready to send, Need an email, and Already sent. This answers the planner’s first operational question before showing creative controls. Missing addresses do not block the ready households. Successfully sent households are excluded automatically.

### Automatic personalization

The planner writes one subject and one message. Vow Motion merges `{{household}}`, `{{couple}}`, and `{{invitation_link}}` on the server. The private URL is never copied through the browser during a bulk send, which removes the highest-risk manual error: sending one family another family’s invitation.

### Test before irreversible action

Send me a test delivers a preview-token version to the signed-in account email. Preview tokens expire quickly and cannot mutate guest data. The test therefore proves rendering and delivery without creating a usable guest reply path.

### Idempotent history

Every household delivery receives its own dispatch identifier, used as the provider idempotency key and persisted before the provider call. A successful status removes that household from the default next campaign. Failed households remain eligible. This follows the late-addition and no-rebroadcast behavior documented by RSVPify and Evite.

### Invitations and update consent are separate

An initial invitation is a transactional communication sent to an address supplied for that invitation. Optional consent collected during RSVP controls later reminders and wedding updates. Treating the initial invitation as a marketing update would create a circular failure: a guest could not opt in until opening a link that the platform refused to send.

### Individual escape hatches remain

Some households need WhatsApp, hand delivery, or a highly personal note. Individual link generation remains below the campaign workflow. It is the exception path, clearly separated from the default bulk operation.

## Implemented workflow

1. Import or add households and guest email addresses.
2. Open Invitations and review readiness totals.
3. Fix missing addresses in Guests or continue with ready households.
4. Select Send invitations. Ready, unsent households are selected automatically.
5. Review recipients and deselect exceptions.
6. Edit the shared subject and body with visible personalization tokens.
7. Review the first merged household preview.
8. Send a test to the account owner.
9. Send all selected household invitations.
10. Review each household’s queued, development, sent, delivered, bounced, complained, suppressed, or failed state.
11. Return later to send only newly ready or failed households.

## Remaining refinements

Provider webhooks update invitation dispatch delivery states. Open tracking should rely on the existing invitation token’s `opened_at` rather than an email tracking pixel. This records the product event that matters—opening the private invitation—without claiming that a mailbox image request proves human attention.

The next usability study should use the 62-household Riviera demo and ask a planner to find missing addresses, exclude one household, send a test, complete the send, and invite a late addition. Measure completion without explanation, errors, and confidence in who received what.

## Sources

1. Paperless Post. “[Make a recipient list and send my Card or Flyer](https://paperlesspost.zendesk.com/hc/en-us/articles/4408180453403-Make-a-recipient-list-and-send-my-Card-or-Flyer).” Updated May 1, 2026.
2. Paperless Post. “[Resend a Card or Flyer](https://paperlesspost.zendesk.com/hc/en-us/articles/206565643-Resend-a-Card-or-Flyer).” Updated September 2, 2025.
3. Paperless Post. “[Can my guests forward their invitations?](https://paperlesspost.zendesk.com/hc/en-us/articles/210076453-Can-my-guests-forward-their-invitations).” Updated August 1, 2025.
4. RSVPify. “[What is the invite list, and do I need to use it?](https://help.rsvpify.com/en/articles/1222532-what-is-the-invite-list-and-do-i-need-to-use-it).” Updated July 28, 2026.
5. RSVPify. “[Merging custom invitee greetings into email invitations](https://help.rsvpify.com/en/articles/6577015-merging-custom-invitee-greetings-into-email-invitations).” March 29, 2023.
6. RSVPify. “[Can I send invitations to newly added guests and not the entire guest list?](https://help.rsvpify.com/en/articles/4645597-can-i-send-invitations-to-newly-added-guests-and-not-the-entire-guest-list).” July 7, 2023.
7. Evite. “[Upload Guest List – Excel Spreadsheet](https://support.evite.com/products/invitations/manage-and-edit-guest-list/upload-guest-list-excel-spreadsheet).” Accessed September 2026.
8. Evite. “[Add More Guests](https://support.evite.com/products/invitations/manage-and-edit-guest-list/add-more-guests).” Accessed September 2026.
9. Greenvelope. “[Insert Personalization](https://support.greenvelope.com/hc/en-us/articles/360039220953-Insert-Personalization).” Accessed September 2026.
10. Zola. “[Can I send a message to my guest, or a bulk message, from my guest list?](https://www.zola.com/faq/115002148872-Can-I-send-a-message-to-my-guest-or-a-bulk-message-from-my-guest-list-).” Accessed September 2026.
11. Zola. “[Can I send Digital Save the Dates through Zola?](https://www.zola.com/faq/115002136551-can-i-send-digital-save-the-dates-through-zola-).” Accessed September 2026.
12. Zola. “[Does Zola offer Digital Invitations?](https://www.zola.com/faq/do-you-offer-digital-invitations).” Accessed September 2026.
