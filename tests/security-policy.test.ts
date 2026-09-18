import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdmin } from "../src/lib/security/admin-policy";
import { sameOrigin } from "../src/lib/security/request-origin";

afterEach(() => vi.unstubAllEnvs());

describe("administrator identity", () => {
  const user = {
    email: "operator@example.test",
    email_verified: false,
    is_demo: false,
    is_admin: false,
  };
  it("does not grant privileges to an unverified allowlisted registration", () => {
    vi.stubEnv("ADMIN_EMAILS", user.email);
    expect(isAdmin(user)).toBe(false);
    expect(isAdmin({ ...user, email_verified: true })).toBe(true);
  });
  it("requires verified non-demo accounts even for database grants", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin({ ...user, is_admin: true })).toBe(false);
    expect(isAdmin({ ...user, email_verified: true, is_admin: true })).toBe(
      true,
    );
    expect(
      isAdmin({ ...user, email_verified: true, is_admin: true, is_demo: true }),
    ).toBe(false);
    expect(isAdmin({ ...user, email_verified: true })).toBe(false);
  });
});

describe("browser mutation origins", () => {
  const request = (headers: HeadersInit = {}) =>
    new Request("https://app.example.test/api", { method: "POST", headers });
  it("accepts exact origins and explicitly configured public origins behind a proxy", () => {
    vi.stubEnv("APP_URL", "https://public.example.test/");
    expect(() =>
      sameOrigin(request({ origin: "https://app.example.test" })),
    ).not.toThrow();
    expect(() =>
      sameOrigin(request({ origin: "https://public.example.test" })),
    ).not.toThrow();
  });
  it.each([
    "http://app.example.test",
    "https://app.example.test:444",
    "null",
    "invalid",
    "https://evil.example.test",
  ])("rejects %s with a safe 403", (origin) => {
    vi.stubEnv("APP_URL", "");
    expect(() => sameOrigin(request({ origin }))).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });
  it("does not trust a supplied Host header to authorize the origin", () => {
    vi.stubEnv("APP_URL", "");
    expect(() =>
      sameOrigin(
        request({
          origin: "https://evil.example.test",
          host: "evil.example.test",
        }),
      ),
    ).toThrow();
  });
  it("blocks originless cross-site browser requests while preserving API clients", () => {
    expect(() =>
      sameOrigin(request({ "sec-fetch-site": "cross-site" })),
    ).toThrow();
    expect(() => sameOrigin(request())).not.toThrow();
  });
});
