import { NextRequest, NextResponse } from "next/server";

/**
 * `script-src 'unsafe-inline'` accepts any inline script, including one an
 * attacker managed to get onto the page — the exact class of attack CSP
 * exists to stop. A per-request nonce replaces it, but a nonce is by
 * definition unique per request, which is fundamentally incompatible with
 * static pre-rendering (the same HTML served to everyone can't embed a
 * different nonce each time). So only the routes below — every one that
 * renders real guest/wedding/account data and was already dynamic before
 * this policy existed — read the nonce (see src/lib/csp-nonce.ts) and get
 * the strict policy. Everything else (the marketing/legal pages, which are
 * static, render no per-request user data, and gain the most from staying
 * statically generated) keeps the permissive fallback. If a route below is
 * ever removed or renamed, update this list — it is not derived from the
 * app's actual routing table.
 */
const STRICT_PREFIXES = [
  "/admin",
  "/contact",
  "/design-preview",
  "/documents",
  "/f/",
  "/i/",
  "/login",
  "/start",
  "/studio",
  "/verify",
  "/w/",
];

function isStrictRoute(pathname: string) {
  return STRICT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const strict = isStrictRoute(pathname);
  const frameAncestors = pathname === "/design-preview" ? "'self'" : "'none'";
  const nonce = strict
    ? Buffer.from(crypto.randomUUID()).toString("base64")
    : "";
  const scriptSrc = strict
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'${
        process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"
      }`
    : `'self' 'unsafe-inline'${
        process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"
      }`;
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  if (strict) requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization, which the CSP header does
    // not meaningfully protect and which are the highest-traffic requests.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};
