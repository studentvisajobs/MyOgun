import { createHmac, timingSafeEqual } from "node:crypto";

export function hashOtp(phone: string, code: string): string {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured");
  }

  return createHmac("sha256", secret)
    .update(JSON.stringify([phone, code]))
    .digest("hex");
}

export function verifyOtpHash(
  phone: string,
  code: string,
  storedHash: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const expected = Buffer.from(hashOtp(phone, code), "hex");
  const actual = Buffer.from(storedHash, "hex");

  return timingSafeEqual(expected, actual);
}
