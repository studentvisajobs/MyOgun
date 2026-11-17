
import { Prisma } from "@/app/generated/prisma/client";

/**
 * Lock a user's database row for the duration of a
 * Prisma interactive transaction.
 *
 * All Guardian Mode and Silent SOS lifecycle operations
 * must acquire this lock before changing shared sessions.
 */
export async function lockGuardianSessionUser(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "User"
    WHERE "id" = ${userId}
    FOR UPDATE
  `;

  if (rows.length !== 1) {
    throw new Error(
      "Cannot lock Guardian Session: user not found."
    );
  }
}
