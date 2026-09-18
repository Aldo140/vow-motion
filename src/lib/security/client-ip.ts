/**
 * `x-forwarded-for` is whatever the client sends unless something in front
 * of this process strips and rewrites it. On Vercel, the platform's edge
 * network guarantees that — a client-supplied value cannot survive to reach
 * the function. A self-hosted deployment gets no such guarantee unless its
 * own reverse proxy (nginx, Caddy, a load balancer) is configured to do the
 * same, which is why this only trusts the header on Vercel or when the
 * operator explicitly confirms that setup with TRUST_PROXY=true.
 *
 * Without a trusted proxy, every rate-limited action shares one bucket
 * instead of one per (spoofable) claimed IP. That is a real usability cost —
 * one abusive visitor can throttle everyone — but it closes the far worse
 * hole of unlimited attempts via a rotating fake header, which is what an
 * attacker gets from any of this file's call sites if left trusting the
 * header unconditionally.
 */
export function clientIp(request: Request): string {
  const trusted = Boolean(process.env.VERCEL) || process.env.TRUST_PROXY === "true";
  if (!trusted) return "untrusted-proxy";
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}
