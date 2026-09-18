import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clientIp } from "../src/lib/security/client-ip";

const req = (forwardedFor?: string) =>
  new Request("https://example.com", {
    headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : {},
  });

describe("clientIp", () => {
  const original = { VERCEL: process.env.VERCEL, TRUST_PROXY: process.env.TRUST_PROXY };
  beforeEach(() => {
    delete process.env.VERCEL;
    delete process.env.TRUST_PROXY;
  });
  afterEach(() => {
    if (original.VERCEL === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = original.VERCEL;
    if (original.TRUST_PROXY === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = original.TRUST_PROXY;
  });

  it("ignores a client-supplied header when neither Vercel nor TRUST_PROXY apply", () => {
    expect(clientIp(req("203.0.113.5"))).toBe("untrusted-proxy");
  });

  it("every untrusted request collapses to the same bucket regardless of the spoofed value", () => {
    expect(clientIp(req("1.2.3.4"))).toBe(clientIp(req("9.9.9.9")));
  });

  it("trusts the header when running on Vercel", () => {
    process.env.VERCEL = "1";
    expect(clientIp(req("203.0.113.5, 70.41.3.18"))).toBe("203.0.113.5");
  });

  it("trusts the header when the operator opts in via TRUST_PROXY", () => {
    process.env.TRUST_PROXY = "true";
    expect(clientIp(req("198.51.100.9"))).toBe("198.51.100.9");
  });

  it("does not trust an unrecognized TRUST_PROXY value", () => {
    process.env.TRUST_PROXY = "1";
    expect(clientIp(req("203.0.113.5"))).toBe("untrusted-proxy");
  });

  it("falls back to unknown when trusted but the header is missing", () => {
    process.env.TRUST_PROXY = "true";
    expect(clientIp(req())).toBe("unknown");
  });
});
