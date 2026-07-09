import { prisma } from "@/lib/prisma";

export class GuardianService {
  static async load(userId: string) {
    return prisma.guardianContact.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  static async createResponders(
    sessionId: string,
    userId: string
  ) {
    const guardians = await this.load(userId);

    if (!guardians.length) return [];

    const responders = await Promise.all(
      guardians.map((guardian) =>
        prisma.emergencyResponder.create({
          data: {
            sessionId,
            guardianContactId: guardian.id,
            guardianName: guardian.name,
            guardianPhone: guardian.phone,
            status: "NOTIFIED",
          },
        })
      )
    );

    return responders;
  }
}