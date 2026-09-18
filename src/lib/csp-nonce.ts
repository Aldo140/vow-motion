import { headers } from "next/headers";

/**
 * Reading the nonce is what makes Next.js stamp its own inline/bootstrap
 * scripts with the same value middleware set on this response — call this
 * from a page that already renders dynamically (every page in this list:
 * see src/middleware.ts for which paths get the strict policy vs. the
 * marketing-page fallback that still allows 'unsafe-inline'). Adding this to
 * a page that was previously statically generated would force it dynamic,
 * so it is deliberately not called from the root layout.
 */
export async function enableStrictCsp() {
  (await headers()).get("x-nonce");
}
