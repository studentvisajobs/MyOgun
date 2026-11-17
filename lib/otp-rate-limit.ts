import { prisma } from "@/lib/prisma";

export async function checkOtpRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  if (!key || limit < 1 || windowMs < 1) {
    throw new Error("Invalid rate-limit configuration");
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${key}::text, 0)
      )
    `;

    const existing = await tx.otpRateLimit.findUnique({
      where: { key },
    });

    if (!existing) {
      await tx.otpRateLimit.create({
        data: {
          key,
          count: 1,
          windowStart: now,
        },
      });

      return true;
    }

    if (existing.windowStart <= cutoff) {
      await tx.otpRateLimit.update({
        where: { key },
        data: {
          count: 1,
          windowStart: now,
        },
      });

      return true;
    }

    if (existing.count >= limit) {
      return false;
    }

    await tx.otpRateLimit.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    });

    return true;
  }, {
    maxWait: 5000,
    timeout: 10000,
  });
}