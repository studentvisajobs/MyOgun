
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  claimForSending,
  updateMany,
  findNotification,
  findActiveNotification,
  findJourney,
  notifyUser,
} = vi.hoisted(() => ({
  claimForSending: vi.fn(),
  updateMany: vi.fn(),
  findNotification: vi.fn(),
  findActiveNotification: vi.fn(),
  findJourney: vi.fn(),
  notifyUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      updateManyAndReturn: claimForSending,
      updateMany,
      findUnique: findNotification,
      findFirst: findActiveNotification,
    },
    safeJourney: {
      findFirst: findJourney,
    },
  },
}));

vi.mock("@/lib/notifications/NotificationService", () => ({
  NotificationService: {
    notifyUser,
  },
}));

import { EmergencyNotificationService } from "../../lib/notifications/EmergencyNotificationService";

describe("EmergencyNotificationService", () => {
beforeEach(() => {
  vi.resetAllMocks();

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "sos:test-emergency",
  });

  findActiveNotification.mockResolvedValue({
    id: "active-notification-test",
  });
});

it("cancels Safe Journey notifications already being sent", async () => {
  updateMany.mockResolvedValue({ count: 1 });

  await EmergencyNotificationService.cancelJourneyNotifications(
    "journey-test-1"
  );

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      journeyId: "journey-test-1",
      OR: [
        { emergencyId: "journey:journey-test-1" },
        {
          emergencyId: {
            startsWith: "journey:journey-test-1:",
          },
        },
      ],
      channel: "EMERGENCY",
      pushStatus: {
        in: ["PENDING", "FAILED", "SENDING"],
      },
    },
    data: {
      pushStatus: "CANCELLED",
    },
  });
});

it("does not dispatch a Safe Journey alert cancelled before Firebase delivery", async () => {
  const cycleId = "2026-10-29T10:00:00.000Z";

  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);

  findNotification.mockResolvedValue({
    journeyId: "journey-test-1",
    emergencyId: `journey:journey-test-1:${cycleId}`,
  });

  findJourney.mockResolvedValue({
    escalatedAt: new Date(cycleId),
  });

  // Simulate cancellation after the journey check.
  findActiveNotification.mockResolvedValue(null);

  const result = await EmergencyNotificationService.sendToGuardian(
    "notification-cancelled-1",
    "guardian-test-1",
    "MyOgun Safe Journey Alert",
    "Simulated overdue journey alert.",
  );

  expect(result).toEqual({
    attempted: false,
    accepted: false,
  });

  expect(findActiveNotification).toHaveBeenCalledWith({
    where: {
      id: "notification-cancelled-1",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    select: {
      id: true,
    },
  });

  expect(notifyUser).not.toHaveBeenCalled();
});

it("does not send a Safe Journey alert after the journey is completed", async () => {
  const cycleId = "2026-10-29T10:00:00.000Z";

  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);

  findNotification.mockResolvedValue({
    journeyId: "journey-test-1",
    emergencyId: `journey:journey-test-1:${cycleId}`,
  });

  findJourney.mockResolvedValue(null);

  const result = await EmergencyNotificationService.sendToGuardian(
    "notification-journey-1",
    "guardian-test-1",
    "MyOgun Safe Journey Alert",
    "Simulated overdue journey alert.",
  );

  expect(result).toEqual({
    attempted: false,
    accepted: false,
  });

  expect(findJourney).toHaveBeenCalledWith({
    where: {
      id: "journey-test-1",
      status: "OVERDUE",
      escalatedAt: { not: null },
    },
    select: {
      escalatedAt: true,
    },
  });

  expect(notifyUser).not.toHaveBeenCalled();
});

    it("blocks an outdated Safe Journey escalation cycle", async () => {
    const oldCycle = "2026-10-29T10:00:00.000Z";
    const newCycle = "2026-10-29T11:00:00.000Z";

    claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);

    findNotification.mockResolvedValue({
        journeyId: "journey-test-1",
        emergencyId: `journey:journey-test-1:${oldCycle}`,
    });

    findJourney.mockResolvedValue({
        escalatedAt: new Date(newCycle),
    });

    const result = await EmergencyNotificationService.sendToGuardian(
        "notification-old-cycle",
        "guardian-test-1",
        "MyOgun Safe Journey Alert",
        "Simulated outdated journey alert.",
    );

    expect(result).toEqual({
        attempted: false,
        accepted: false,
    });

    expect(findJourney).toHaveBeenCalledOnce();
    expect(notifyUser).not.toHaveBeenCalled();

    expect(updateMany).toHaveBeenCalledWith({
        where: {
        id: "notification-old-cycle",
        pushStatus: "SENDING",
        pushAttempts: 1,
        },
        data: {
        pushStatus: "CANCELLED",
        },
    });
    });

  it("does not resend an already claimed or sent notification", async () => {
    claimForSending.mockResolvedValue([]);

    const result = await EmergencyNotificationService.sendToGuardian(
      "test-notification-1",
      "test-guardian-1",
      "MyOgun SOS Emergency",
      "This is a simulated test notification.",
    );

    expect(result).toEqual({
      attempted: false,
      accepted: false,
    });

    expect(claimForSending).toHaveBeenCalledOnce();
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it("records a successful Firebase notification", async () => {
    claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);

    notifyUser.mockResolvedValue({
      userCount: 1,
      tokenCount: 1,
      successCount: 1,
      failureCount: 0,
      usersWithoutTokens: 0,
    });

    const result = await EmergencyNotificationService.sendToGuardian(
      "test-notification-2",
      "test-guardian-2",
      "MyOgun SOS Emergency",
      "Simulated emergency alert.",
    );

    expect(result.attempted).toBe(true);
    expect(result.accepted).toBe(true);
    expect(notifyUser).toHaveBeenCalledOnce();

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "test-notification-2",
        pushStatus: "SENDING",
        pushAttempts: 1,
      },
      data: {
        pushStatus: "SENT",
        pushSentAt: expect.any(Date),
      },
    });
  });

  it("records a failed Firebase notification", async () => {
    claimForSending.mockResolvedValue([{ pushAttempts: 2 }]);

    notifyUser.mockResolvedValue({
      userCount: 1,
      tokenCount: 1,
      successCount: 0,
      failureCount: 1,
      usersWithoutTokens: 0,
    });

    const result = await EmergencyNotificationService.sendToGuardian(
      "test-notification-3",
      "test-guardian-3",
      "MyOgun SOS Emergency",
      "Simulated failed emergency alert.",
    );

    expect(result.attempted).toBe(true);
    expect(result.accepted).toBe(false);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "test-notification-3",
        pushStatus: "SENDING",
        pushAttempts: 2,
      },
      data: {
        pushStatus: "FAILED",
      },
    });
  });

  it("includes the three-attempt limit when claiming notifications", async () => {
    claimForSending.mockResolvedValue([]);

    const result = await EmergencyNotificationService.sendToGuardian(
      "test-notification-4",
      "test-guardian-4",
      "MyOgun SOS Emergency",
      "Simulated retry limit test.",
    );

    expect(result.attempted).toBe(false);
    expect(result.accepted).toBe(false);
    expect(notifyUser).not.toHaveBeenCalled();

    expect(claimForSending).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: "test-notification-4",
        pushAttempts: {
          lt: 3,
        },
      }),
      data: expect.objectContaining({
        pushStatus: "SENDING",
        pushAttempts: {
          increment: 1,
        },
      }),
      select: {
        pushAttempts: true,
      },
    });
  });
  it("includes recovery for interrupted notification attempts", async () => {
  claimForSending.mockResolvedValue([]);

  await EmergencyNotificationService.claimForSending(
    "test-notification-5",
  );

  expect(claimForSending).toHaveBeenCalledWith({
    where: expect.objectContaining({
      id: "test-notification-5",
      OR: expect.arrayContaining([
        expect.objectContaining({
          pushStatus: "SENDING",
          lastAttemptAt: {
            lt: expect.any(Date),
          },
        }),
      ]),
      pushAttempts: {
        lt: 3,
      },
    }),
    data: expect.objectContaining({
      pushStatus: "SENDING",
    }),
    select: {
      pushAttempts: true,
    },
  });
});

  it("requires a 60-second delay before retrying failed notifications", async () => {
    claimForSending.mockResolvedValue([]);

    const before = Date.now();

    await EmergencyNotificationService.claimForSending(
      "test-notification-retry-delay"
    );

    const after = Date.now();

    const query = claimForSending.mock.calls[0][0];

    const failedCondition = query.where.OR.find(
      (condition: {
        pushStatus: string;
        lastAttemptAt?: { lt: Date };
      }) => condition.pushStatus === "FAILED"
    );

    expect(failedCondition).toBeDefined();

    const retryCutoff = failedCondition.lastAttemptAt.lt.getTime();

    expect(retryCutoff).toBeGreaterThanOrEqual(
      before - 60_000
    );

    expect(retryCutoff).toBeLessThanOrEqual(
      after - 60_000
    );

    expect(query.where.pushAttempts).toEqual({
      lt: 3,
    });

    expect(notifyUser).not.toHaveBeenCalled();
  });

});
