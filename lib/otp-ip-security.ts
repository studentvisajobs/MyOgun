import { createHmac } from "node:crypto";

export function hashRateLimitIp(ip: string): string {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured");
  }

  if (!ip || !ip.trim()) {
    throw new Error("Client IP address is missing");
  }

  return createHmac("sha256", secret)
    .update("myogun:otp-ip-rate-limit:v1:")
    .update(ip.trim())
    .digest("hex");
}
