import { prisma } from "@/lib/prisma";
import { GuardianEscalationService } from "@/lib/services/GuardianEscalationService";

export type JourneyMonitorResult = {
  checked: number;
  markedOverdue: number;
  escalationChecked: number;
  escalated: number;
};

export class JourneyMonitor {
  static async run(): Promise<JourneyMonitorResult> {
    const now = new Date();

    const expiredJourneys =
      await prisma.safeJourney.findMany({
        where: {
          status: "ACTIVE",
          estimatedArrival: {
            not: null,
            lte: now,
          },
        },
        select: {
          id: true,
        },
      });

    let markedOverdue = 0;

    for (const journey of expiredJourneys) {
      const result = await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.safeJourney.updateMany({
              where: {
                id: journey.id,
                status: "ACTIVE",
                estimatedArrival: {
                  not: null,
                  lte: now,
                },
              },
              data: {
                status: "OVERDUE",
              },
            });

          if (updated.count === 0) {
            return false;
          }

          await tx.safeJourneyTimeline.create({
            data: {
              journeyId: journey.id,
              message:
                "Estimated arrival time passed. Journey marked as overdue.",
            },
          });

          return true;
        }
      );

      if (result) {
        markedOverdue += 1;
      }
    }

    const escalationResult =
      await GuardianEscalationService.run();

    return {
      checked: expiredJourneys.length,
      markedOverdue,
      escalationChecked:
        escalationResult.checked,
      escalated:
        escalationResult.escalated,
    };
  }
}