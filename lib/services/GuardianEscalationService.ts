
import { prisma } from "@/lib/prisma";
import { GuardianRecipientService } from "@/lib/services/GuardianRecipientService";
import { EmergencyNotificationService } from "@/lib/notifications/EmergencyNotificationService";

export type GuardianEscalationResult = {
  checked: number;
  escalated: number;
};

export class GuardianEscalationService {
  static readonly GRACE_PERIOD_MINUTES = 10;

  static async run(): Promise<GuardianEscalationResult> {
    const cutoff = new Date(
      Date.now() - this.GRACE_PERIOD_MINUTES * 60 * 1000
    );

    const journeys = await prisma.safeJourney.findMany({
      where: {
        status: "OVERDUE",
        OR: [
          {
            updatedAt: { lte: cutoff },
            escalatedAt: null,
          },
          {
            escalatedAt: { not: null },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        destination: true,
        escalatedAt: true,
      },
    });

    let escalated = 0;

    for (const journey of journeys) {
      if (!journey.userId) {
        continue;
      }

      try {
        const guardianIds =
          await GuardianRecipientService.getAuthorizedGuardianIds(
            journey.userId
          );

        if (guardianIds.length === 0) {
          continue;
        }

        // Confirm the journey is still overdue before preparing alerts.
        const currentJourney = await prisma.safeJourney.findFirst({
          where: {
            id: journey.id,
            status: "OVERDUE",
          },
          select: {
            id: true,
            escalatedAt: true,
          },
        });

        if (!currentJourney) {
          continue;
        }

        const title = "MyOgun Safe Journey Alert";
        const message =
          `A MyOgun user's journey to ${journey.destination} ` +
          "is overdue. Please check on them immediately.";


        if (!currentJourney.escalatedAt) {
          const updated = await prisma.safeJourney.updateMany({
            where: {
              id: journey.id,
              status: "OVERDUE",
              escalatedAt: null,
            },
            data: {
              escalatedAt: new Date(),
            },
          });

          if (updated.count > 0) {
            escalated++;

            await prisma.safeJourneyTimeline.create({
              data: {
                journeyId: journey.id,
                message:
                  "Overdue journey escalation initiated. Guardian notifications queued.",
              },
            });
          }
        }

      // Recheck the journey and retrieve its saved escalation timestamp.
      const stillOverdue = await prisma.safeJourney.findFirst({
        where: {
          id: journey.id,
          status: "OVERDUE",
        },
        select: {
          id: true,
          escalatedAt: true,
        },
      });

    if (!stillOverdue?.escalatedAt) {
      continue;
    }

    const escalationCycleId = stillOverdue.escalatedAt.toISOString();

            for (const guardianId of guardianIds) {
              try {
                const notification =
                  await EmergencyNotificationService.getOrCreateJourneyNotification({
                  guardianUserId: guardianId,
                  journeyId: journey.id,
                  escalationCycleId,
                  title,
                  message,
                  });

            await EmergencyNotificationService.sendToGuardian(
              notification.id,
              guardianId,
              title,
              message
            );
          } catch (error) {
            console.error(
              "Safe Journey guardian notification error:",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Safe Journey escalation error:",
          journey.id,
          error
        );
      }
    }

    return {
      checked: journeys.length,
      escalated,
    };
  }
}
