
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

export class GuardianRecipientService {
  static async getAuthorizedGuardianIds(
    userId: string,
    db: Prisma.TransactionClient = prisma
  ): Promise<string[]> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user) return [];

    const invitations =
      await prisma.guardianInvitation.findMany({
        where: {
          status: "ACCEPTED",
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        select: {
          senderId: true,
          receiverId: true,
        },
      });

    const candidateIds = [
      ...new Set(
        invitations
          .map((invitation) =>
            invitation.senderId === userId
              ? invitation.receiverId
              : invitation.senderId
          )
          .filter(
            (id): id is string =>
              Boolean(id) && id !== userId
          )
      ),
    ];

    if (candidateIds.length === 0) return [];

    const candidates = await prisma.user.findMany({
      where: {
        id: { in: candidateIds },
      },
      select: {
        id: true,
        phone: true,
      },
    });

    const contacts =
      await prisma.guardianContact.findMany({
        where: { userId },
        select: { phone: true },
      });

    const normalizePhone = (phone: string) =>
    phone.replace(/[^\d+]/g, "").trim();

    const contactPhones = new Set(
    contacts.map((contact) =>
        normalizePhone(contact.phone)
    )
    );

    return candidates
      .filter((candidate) =>
        contactPhones.has(normalizePhone(candidate.phone))
      )
      .map((candidate) => candidate.id);
  }
}
