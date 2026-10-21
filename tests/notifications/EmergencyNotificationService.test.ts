
import { beforeEach, describe, expect, it, vi } from "vitest";

const { claimForSending, updateMany, notifyUser } = vi.hoisted(() => ({
  claimForSending: vi.fn(),
  updateMany: vi.fn(),
  notifyUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      updateManyAndReturn: claimForSending,
      updateMany,
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
    vi.clearAllMocks();
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
});
