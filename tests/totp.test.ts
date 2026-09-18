import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  generateBackupCodes,
  generateTotpSecret,
  otpAuthUrl,
  totpAt,
  verifyTotp,
} from "../src/lib/totp";

// RFC 6238 Appendix B publishes these as 8-digit SHA1 test vectors for the
// ASCII secret "12345678901234567890". The truncation formula takes the raw
// binary value mod 10^digits, so the 6-digit code is that same 8-digit
// value's last 6 digits, e.g. 94287082 -> 287082.
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890", "ascii"));
const VECTORS: [number, string][] = [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
];

describe("totp", () => {
  it("round-trips base32 encoding", () => {
    const original = Buffer.from("a real random secret, 20 bytes!!", "utf8");
    expect(base32Decode(base32Encode(original)).equals(original)).toBe(true);
  });

  it("matches the RFC 6238 SHA1 test vectors", () => {
    for (const [unixSeconds, expected] of VECTORS)
      expect(totpAt(RFC_SECRET, unixSeconds * 1000)).toBe(expected);
  });

  it("verifies a code generated for the current time", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    expect(verifyTotp(secret, totpAt(secret, now), now)).toBe(true);
  });

  it("accepts a code from one step of clock drift either side", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const earlier = totpAt(secret, now - 30_000);
    const later = totpAt(secret, now + 30_000);
    expect(verifyTotp(secret, earlier, now)).toBe(true);
    expect(verifyTotp(secret, later, now)).toBe(true);
  });

  it("rejects a code two steps outside the window", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const farOff = totpAt(secret, now + 90_000);
    expect(verifyTotp(secret, farOff, now)).toBe(false);
  });

  it("rejects malformed input instead of throwing", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "abcdef", Date.now())).toBe(false);
    expect(verifyTotp(secret, "12345", Date.now())).toBe(false);
    expect(verifyTotp(secret, "", Date.now())).toBe(false);
  });

  it("builds a valid otpauth:// URL", () => {
    const url = otpAuthUrl("JBSWY3DPEHPK3PXP", "person@example.com", "Vow Motion");
    expect(url).toMatch(/^otpauth:\/\/totp\//);
    expect(url).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(url).toContain("issuer=Vow%20Motion");
  });

  it("generates distinct, formatted backup codes", () => {
    const codes = generateBackupCodes(8);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) expect(code).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
  });
});
