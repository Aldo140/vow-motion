import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32 (no padding), the format authenticator apps expect. */
export function base32Encode(buffer: Buffer): string {
  let bits = 0,
    value = 0,
    output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0,
    value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A fresh random secret for one enrollment attempt. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** RFC 6238 TOTP over HMAC-SHA1, the algorithm every mainstream authenticator app implements. */
export function totpAt(secretBase32: string, time: number, step = 30, digits = 6): string {
  const counter = Math.floor(time / 1000 / step);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const key = base32Decode(secretBase32);
  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** digits).padStart(digits, "0");
}

/**
 * Accepts the current 30-second step and one step either side, so a code
 * typed just as the clock rolls over — or a slightly drifted device clock —
 * still verifies.
 */
export function verifyTotp(
  secretBase32: string,
  token: string,
  now = Date.now(),
  step = 30,
  window = 1,
): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  for (let offset = -window; offset <= window; offset++) {
    const expected = totpAt(secretBase32, now + offset * step * 1000, step);
    if (
      expected.length === token.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(token))
    )
      return true;
  }
  return false;
}

export function otpAuthUrl(secretBase32: string, email: string, issuer = "Vow Motion") {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Human-friendly one-time recovery codes, for when the authenticator device is unavailable. */
export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(5).toString("hex").toUpperCase().replace(/(.{5})(.{5})/, "$1-$2"),
  );
}
