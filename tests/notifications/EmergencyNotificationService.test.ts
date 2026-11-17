
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  claimForSending,
  updateMany,
  findNotification,
  findActiveNotification,
  findJourney,
  findGuardianSession,
  notifyUser,
  getAuthorizedGuardianIds,
} = vi.hoisted(() => ({
  claimForSending: vi.fn(),
  updateMany: vi.fn(),
  findNotification: vi.fn(),
  findActiveNotification: vi.fn(),
  findJourney: vi.fn(),
  findGuardianSession: vi.fn(),
  notifyUser: vi.fn(),
  getAuthorizedGuardianIds: vi.fn(),
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
        guardianSession: {
      findUnique: findGuardianSession,
    },
  },
}));

vi.mock("@/lib/notifications/NotificationService", () => ({
  NotificationService: {
    notifyUser,
  },
}));

vi.mock("@/lib/services/GuardianRecipientService", () => ({
  GuardianRecipientService: {
    getAuthorizedGuardianIds,
  },
}));

import { EmergencyNotificationService } from "../../lib/notifications/EmergencyNotificationService";

describe("EmergencyNotificationService", () => {
beforeEach(() => {
  vi.resetAllMocks();
      findGuardianSession.mockResolvedValue({
      userId: "owner-test-1",
      status: "ACTIVE",
      guardianModeEnabled: true,
      linkedEmergencies: [],
    });
    getAuthorizedGuardianIds.mockResolvedValue(["guardian-test-1"]);

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "sos:test-emergency",
  });

  findActiveNotification.mockResolvedValue({
    id: "active-notification-test",
  });
});

it("blocks Silent SOS alerts to removed guardians", async () => {
  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);
  updateMany.mockResolvedValue({ count: 1 });

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "guardian-session:removed-guardian-sos-test",
  });

  findGuardianSession.mockResolvedValue({
    userId: "owner-test-1",
    status: "ACTIVE",
    guardianModeEnabled: false,
    linkedEmergencies: [
      {
        id: "active-silent-sos-test-2",
      },
    ],
  });

  // This guardian has been removed from the authorised network.
  getAuthorizedGuardianIds.mockResolvedValue([]);

  const result = await EmergencyNotificationService.sendToGuardian(
    "removed-guardian-sos-notification",
    "guardian-test-1",
    "MyOgun Silent SOS",
    "Emergency alert.",
  );

  expect(result.attempted).toBe(false);
  expect(result.accepted).toBe(false);
  expect(notifyUser).not.toHaveBeenCalled();

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "removed-guardian-sos-notification",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    data: {
      pushStatus: "CANCELLED",
    },
  });
});

it("cancels Silent SOS alerts when the emergency is no longer active", async () => {
  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);
  updateMany.mockResolvedValue({ count: 1 });

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "guardian-session:closed-silent-sos-test",
  });

  findGuardianSession.mockResolvedValue({
    userId: "owner-test-1",
    status: "ACTIVE",
    guardianModeEnabled: false,
    linkedEmergencies: [],
  });

  getAuthorizedGuardianIds.mockResolvedValue(["guardian-test-1"]);

  const result = await EmergencyNotificationService.sendToGuardian(
    "closed-silent-sos-notification-test",
    "guardian-test-1",
    "MyOgun Silent SOS",
    "Emergency alert.",
  );

  expect(result.attempted).toBe(false);
  expect(result.accepted).toBe(false);
  expect(notifyUser).not.toHaveBeenCalled();

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "closed-silent-sos-notification-test",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    data: {
      pushStatus: "CANCELLED",
    },
  });
});

it("sends Silent SOS alerts when Guardian Mode is disabled", async () => {
  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);
  updateMany.mockResolvedValue({ count: 1 });

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "guardian-session:silent-sos-test-1",
  });

  findGuardianSession.mockResolvedValue({
    userId: "owner-test-1",
    status: "ACTIVE",
    guardianModeEnabled: false,
    linkedEmergencies: [
      {
        id: "active-silent-sos-test-1",
      },
    ],
  });

  getAuthorizedGuardianIds.mockResolvedValue(["guardian-test-1"]);

  notifyUser.mockResolvedValue({
    userCount: 1,
    tokenCount: 1,
    successCount: 1,
    failureCount: 0,
    usersWithoutTokens: 0,
  });

  const result = await EmergencyNotificationService.sendToGuardian(
    "silent-sos-notification-test-1",
    "guardian-test-1",
    "MyOgun Silent SOS",
    "Silent emergency alert.",
  );

  expect(result.attempted).toBe(true);
  expect(result.accepted).toBe(true);

  expect(notifyUser).toHaveBeenCalledWith(
    "guardian-test-1",
    "MyOgun Silent SOS",
    "Silent emergency alert.",
    "/guardian/respond/silent-sos-test-1",
  );

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "silent-sos-notification-test-1",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    data: {
      pushStatus: "SENT",
      pushSentAt: expect.any(Date),
    },
  });
});

it("cancels Guardian Mode alerts when the session was deleted", async () => {
  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);
  updateMany.mockResolvedValue({ count: 1 });

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "guardian-session:deleted-session-test-1",
  });

  // The Guardian Session no longer exists.
  findGuardianSession.mockResolvedValue(null);

  const result = await EmergencyNotificationService.sendToGuardian(
    "deleted-session-notification-test-1",
    "guardian-test-1",
    "MyOgun SOS Emergency",
    "Simulated Guardian Mode emergency.",
  );


  expect(findGuardianSession).toHaveBeenCalledWith({
    where: {
      id: "deleted-session-test-1",
    },
    select: {
      userId: true,
      status: true,
      guardianModeEnabled: true,
      linkedEmergencies: {
        where: {
          silentSOS: true,
          status: {
            in: ["ACTIVE", "MONITORING", "RESPONDING"],
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "deleted-session-notification-test-1",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    data: {
      pushStatus: "CANCELLED",
    },
  });

  expect(notifyUser).not.toHaveBeenCalled();

  expect(result).toEqual({
    attempted: false,
    accepted: false,
  });
});

it("does not send a Guardian Mode alert cancelled during authorization", async () => {
  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "guardian-session:active-session-test-1",
  });

  findGuardianSession.mockResolvedValue({
    userId: "owner-test-1",
    status: "ACTIVE",
    guardianModeEnabled: true,
    linkedEmergencies: [],
  });

  getAuthorizedGuardianIds.mockResolvedValue(["guardian-test-1"]);

  // Notification was cancelled after being claimed.
  findActiveNotification.mockResolvedValue(null);

  const result = await EmergencyNotificationService.sendToGuardian(
    "cancelled-guardian-notification-test-1",
    "guardian-test-1",
    "MyOgun SOS Emergency",
    "Simulated Guardian Mode emergency.",
  );

  expect(findActiveNotification).toHaveBeenCalledWith({
    where: {
      id: "cancelled-guardian-notification-test-1",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    select: {
      id: true,
    },
  });

  expect(notifyUser).not.toHaveBeenCalled();

  expect(result).toEqual({
    attempted: false,
    accepted: false,
  });
});

it("cancels queued alerts when Guardian Mode is disabled", async () => {
  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);
  updateMany.mockResolvedValue({ count: 1 });

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "guardian-session:disabled-session-test-1",
  });

  findGuardianSession.mockResolvedValue({
    userId: "owner-test-1",
    status: "ACTIVE",
    guardianModeEnabled: false,
    linkedEmergencies: [],
  });

  const result = await EmergencyNotificationService.sendToGuardian(
    "disabled-session-notification-test-1",
    "guardian-test-1",
    "MyOgun SOS Emergency",
    "Simulated Guardian Mode emergency.",
  );

  expect(findGuardianSession).toHaveBeenCalledWith({
    where: {
      id: "disabled-session-test-1",
    },
    select: {
      userId: true,
      status: true,
      guardianModeEnabled: true,
      linkedEmergencies: {
        where: {
          silentSOS: true,
          status: {
            in: ["ACTIVE", "MONITORING", "RESPONDING"],
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "disabled-session-notification-test-1",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    data: {
      pushStatus: "CANCELLED",
    },
  });

  expect(getAuthorizedGuardianIds).not.toHaveBeenCalled();
  expect(notifyUser).not.toHaveBeenCalled();

  expect(result).toEqual({
    attempted: false,
    accepted: false,
  });
});

it("cancels queued Guardian Mode alerts for removed guardians", async () => {
  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);
  updateMany.mockResolvedValue({ count: 1 });

  findNotification.mockResolvedValue({
    journeyId: null,
    emergencyId: "guardian-session-test-1",
  });

  findGuardianSession.mockResolvedValue({
    userId: "owner-test-1",
    status: "ACTIVE",
    guardianModeEnabled: true,
    linkedEmergencies: [],
  });

  // Guardian was removed after the notification was queued.
  getAuthorizedGuardianIds.mockResolvedValue([]);

  const result = await EmergencyNotificationService.sendToGuardian(
    "guardian-notification-test-1",
    "guardian-test-1",
    "MyOgun SOS Emergency",
    "Simulated Guardian Mode emergency.",
  );

  expect(findGuardianSession).toHaveBeenCalledWith({
    where: {
      id: "guardian-session-test-1",
    },
    select: {
      userId: true,
      status: true,
      guardianModeEnabled: true,
      linkedEmergencies: {
        where: {
          silentSOS: true,
          status: {
            in: ["ACTIVE", "MONITORING", "RESPONDING"],
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
    "owner-test-1",
  );

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "guardian-notification-test-1",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    data: {
      pushStatus: "CANCELLED",
    },
  });

  expect(notifyUser).not.toHaveBeenCalled();

  expect(result).toEqual({
    attempted: false,
    accepted: false,
  });
});

it("cancels queued Safe Journey alerts for removed guardians", async () => {
  const cycleId = "2026-10-29T10:00:00.000Z";

  claimForSending.mockResolvedValue([{ pushAttempts: 1 }]);
  updateMany.mockResolvedValue({ count: 1 });

  findNotification.mockResolvedValue({
    journeyId: "journey-test-1",
    emergencyId: `journey:journey-test-1:${cycleId}`,
  });

  findJourney.mockResolvedValue({
    userId: "owner-test-1",
    escalatedAt: new Date(cycleId),
  });

  // Guardian has been removed from the Guardian Circle.
  getAuthorizedGuardianIds.mockResolvedValue([]);

  const result = await EmergencyNotificationService.sendToGuardian(
    "notification-test-1",
    "guardian-test-1",
    "MyOgun Safe Journey Alert",
    "Simulated emergency notification.",
  );

  expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
    "owner-test-1",
  );

  expect(updateMany).toHaveBeenCalledWith({
    where: {
      id: "notification-test-1",
      pushStatus: "SENDING",
      pushAttempts: 1,
    },
    data: {
      pushStatus: "CANCELLED",
    },
  });

  expect(notifyUser).not.toHaveBeenCalled();

  expect(result).toEqual({
    attempted: false,
    accepted: false,
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
    userId: "owner-test-1",
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
      userId: true,
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
    findActiveNotification.mockResolvedValue({
      id: "test-notification-2",
    });

    findNotification.mockResolvedValue({
      journeyId: null,
      emergencyId: "guardian-session:firebase-success-test",
    });
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
      "guardian-test-1",
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

    findActiveNotification.mockResolvedValue({
      id: "test-notification-3",
    });

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
      "guardian-test-1",
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
