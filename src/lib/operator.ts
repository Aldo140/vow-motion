/**
 * The operating business's real legal identity. This cannot be filled in by
 * code — it is a fact about who runs this deployment, in which jurisdiction,
 * and how to reach them about privacy. Set the OPERATOR_* env vars once that
 * is known; until then, /privacy says plainly that it is unconfigured rather
 * than showing placeholder or invented text as if it were real.
 */
export function operatorProfile() {
  const legalName = process.env.OPERATOR_LEGAL_NAME?.trim() || "";
  const jurisdiction = process.env.OPERATOR_JURISDICTION?.trim() || "";
  const address = process.env.OPERATOR_ADDRESS?.trim() || "";
  const privacyContact = process.env.OPERATOR_PRIVACY_CONTACT?.trim() || "";
  const privacyPolicyUrl = process.env.OPERATOR_PRIVACY_POLICY_URL?.trim() || "";
  const termsUrl = process.env.OPERATOR_TERMS_URL?.trim() || "";
  return {
    legalName,
    jurisdiction,
    address,
    privacyContact,
    privacyPolicyUrl,
    termsUrl,
    configured: Boolean(legalName && jurisdiction && privacyContact),
  };
}
