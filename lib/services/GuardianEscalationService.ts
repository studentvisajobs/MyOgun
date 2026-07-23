import { prisma } from "@/lib/prisma";

export type GuardianEscalationResult = {
  checked: number;
  escalated: number;
};

export class GuardianEscalationService {
  static readonly GRACE_PERIOD_MINUTES = 10;

  static async run(): Promise<GuardianEscalationResult> {
    const cutoff = new Date(
      Date.now() -
        this.GRACE_PERIOD_MINUTES * 60 * 1000
    );

    const journeys =
      await prisma.safeJourney.findMany({
        where: {
          status: "OVERDUE",
          updatedAt: {
            lte: cutoff,
          },
          escalatedAt: null,
        },
        select: {
          id: true,
        },
      });

    let escalated = 0;

    for (const journey of journeys) {
      const result = await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.safeJourney.updateMany({
              where: {
                id: journey.id,
                status: "OVERDUE",
                escalatedAt: null,
              },
              data: {
                escalatedAt: new Date(),
              },
            });

          if (updated.count === 0) {
            return false;
          }

          await tx.safeJourneyTimeline.create({
            data: {
              journeyId: journey.id,
              message:
                "Journey escalated to guardians after the grace period.",
            },
          });

          return true;
        }
      );

      if (result) {
        escalated += 1;
      }
    }

    return {
      checked: journeys.length,
      escalated,
    };
  }
}