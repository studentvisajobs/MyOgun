import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findJourney,
  updateJourney,
  cancelNotifications,
} = vi.hoisted(() => ({
  findJourney: vi.fn(),
  updateJourney: vi.fn(),
  cancelNotifications: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    safeJourney: {
      findFirst: findJourney,
      update: updateJourney,
    },
  },
}));

vi.mock(
  "@/lib/notifications/EmergencyNotificationService",
  () => ({
    EmergencyNotificationService: {
      cancelJourneyNotifications: cancelNotifications,
    },
  })
);

import { JourneyService } from "../../lib/services/JourneyService";

describe("JourneyService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("completes an active journey and cancels guardian notifications", async () => {
    findJourney.mockResolvedValue({
      id: "journey-test-1",
    });

    updateJourney.mockResolvedValue({
      id: "journey-test-1",
      status: "COMPLETED",
      endedAt: new Date(),
      timeline: [],
      locations: [],
    });

    cancelNotifications.mockResolvedValue({
      count: 1,
    });

    const result = await JourneyService.stop({
      userId: "user-test-1",
      journeyId: "journey-test-1",
    });

    expect(result.status).toBe("COMPLETED");

    expect(findJourney).toHaveBeenCalledWith({
      where: {
        id: "journey-test-1",
        userId: "user-test-1",
        status: {
          in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
        },
      },
      select: {
        id: true,
      },
    });

    expect(updateJourney).toHaveBeenCalledWith(
      expect.objectContaining({
       where: {
        id: "journey-test-1",
        userId: "user-test-1",
        status: {
          in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
        },
      },
        data: expect.objectContaining({
          status: "COMPLETED",
          endedAt: expect.any(Date),
        }),
      })
    );

    expect(cancelNotifications).toHaveBeenCalledWith(
      "journey-test-1"
    );
  });
});