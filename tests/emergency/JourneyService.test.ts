import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findJourney,
  updateJourney,
  upsertSharedLocation,
  runTransaction,
  cancelNotifications,
} = vi.hoisted(() => ({
  findJourney: vi.fn(),
  updateJourney: vi.fn(),
  upsertSharedLocation: vi.fn(),
  runTransaction: vi.fn(),
  cancelNotifications: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    safeJourney: {
      findFirst: findJourney,
      update: updateJourney,
    },
    sharedLocation: {
      upsert: upsertSharedLocation,
    },
    $transaction: runTransaction,
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
     findJourney.mockResolvedValue(null);
    runTransaction.mockImplementation(async (callback) => {
      return callback({
        safeJourney: {
          update: updateJourney,
        },
        sharedLocation: {
          upsert: upsertSharedLocation,
        },
      });
    });
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
    it("extends an overdue journey and cancels guardian notifications", async () => {
    findJourney.mockResolvedValue({
      id: "journey-test-2",
    });

    updateJourney.mockResolvedValue({
      id: "journey-test-2",
      status: "ACTIVE",
      estimatedArrival: new Date(),
      escalatedAt: null,
      timeline: [],
    });

    cancelNotifications.mockResolvedValue({ count: 1 });

    const result = await JourneyService.extend({
      userId: "user-test-1",
      journeyId: "journey-test-2",
      minutes: 30,
    });

    expect(result.status).toBe("ACTIVE");

    expect(findJourney).toHaveBeenCalledWith({
      where: {
        id: "journey-test-2",
        userId: "user-test-1",
        status: "OVERDUE",
      },
      select: {
        id: true,
      },
    });

    expect(updateJourney).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "journey-test-2",
          userId: "user-test-1",
          status: "OVERDUE",
        },
        data: expect.objectContaining({
          status: "ACTIVE",
          estimatedArrival: expect.any(Date),
          escalatedAt: null,
        }),
      })
    );

    expect(cancelNotifications).toHaveBeenCalledWith(
      "journey-test-2"
    );
  });
  it("does not overwrite a journey that changed status before completion", async () => {
  findJourney.mockResolvedValue({
    id: "journey-test-3",
  });

  // Simulate another operation completing the journey
  // after our initial status check.
  updateJourney.mockResolvedValue({
    id: "journey-test-3",
    status: "COMPLETED",
  });

  await JourneyService.stop({
    userId: "user-test-1",
    journeyId: "journey-test-3",
  });

  expect(updateJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: "journey-test-3",
        userId: "user-test-1",
        status: {
          in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
        },
      }),
    })
  );
});
it("does not reactivate a journey that changed status before extension", async () => {
  findJourney.mockResolvedValue({ id: "journey-test-4" });

  updateJourney.mockResolvedValue({
    id: "journey-test-4",
    status: "ACTIVE",
    estimatedArrival: new Date(),
    escalatedAt: null,
    timeline: [],
  });

  await JourneyService.extend({
    userId: "user-test-1",
    journeyId: "journey-test-4",
    minutes: 30,
  });

  expect(updateJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: "journey-test-4",
        userId: "user-test-1",
        status: "OVERDUE",
      }),
    })
  );
});
it("does not cancel notifications when completion loses a race", async () => {
  findJourney.mockResolvedValue({ id: "journey-test-5" });

  updateJourney.mockRejectedValue({
    code: "P2025",
  });

  await expect(
    JourneyService.stop({
      userId: "user-test-1",
      journeyId: "journey-test-5",
    })
  ).rejects.toMatchObject({
    status: 404,
  });

  expect(cancelNotifications).not.toHaveBeenCalled();
});
it("does not cancel notifications when extension loses a race", async () => {
  findJourney.mockResolvedValue({ id: "journey-test-6" });

  updateJourney.mockRejectedValue({
    code: "P2025",
  });

  await expect(
    JourneyService.extend({
      userId: "user-test-1",
      journeyId: "journey-test-6",
      minutes: 30,
    })
  ).rejects.toMatchObject({
    status: 404,
  });

  expect(cancelNotifications).not.toHaveBeenCalled();
});
it("does not update shared location when journey update fails", async () => {
  findJourney.mockResolvedValue({
    id: "journey-test-7",
  });

  updateJourney.mockRejectedValue({
    code: "P2025",
  });

  await expect(
    JourneyService.update({
      userId: "user-test-1",
      journeyId: "journey-test-7",
      latitude: 53.4808,
      longitude: -2.2426,
    })
  ).rejects.toMatchObject({
    name: "JourneyServiceError",
    status: 404,
  });

  expect(runTransaction).toHaveBeenCalledOnce();
  expect(updateJourney).toHaveBeenCalledOnce();

  expect(updateJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "journey-test-7",
        userId: "user-test-1",
        status: {
          in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
        },
      },
    })
  );

  expect(upsertSharedLocation).not.toHaveBeenCalled();
});
it("does not reactivate a completed journey during check-in", async () => {
  findJourney.mockResolvedValue({
    id: "journey-test-8",
  });

  updateJourney.mockRejectedValue({
    code: "P2025",
  });

  await expect(
    JourneyService.checkIn({
      userId: "user-test-1",
      journeyId: "journey-test-8",
    })
  ).rejects.toMatchObject({
    name: "JourneyServiceError",
    status: 404,
  });

  expect(updateJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "journey-test-8",
        userId: "user-test-1",
        status: {
          in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
        },
      },
    })
  );
});
it("retrieves the latest journey when overdue update loses a race", async () => {
  const expiredJourney = {
    id: "journey-test-9",
    status: "ACTIVE",
    estimatedArrival: new Date(Date.now() - 60_000),
  };

  const latestJourney = {
    id: "journey-test-9",
    status: "ACTIVE",
    estimatedArrival: new Date(Date.now() + 30 * 60_000),
  };

  findJourney
    .mockResolvedValueOnce(expiredJourney)
    .mockResolvedValueOnce(latestJourney);

  updateJourney.mockRejectedValue({
    code: "P2025",
  });

  const result = await JourneyService.getActive("user-test-1");

  expect(result).toEqual(latestJourney);

  expect(updateJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "journey-test-9",
        userId: "user-test-1",
        status: "ACTIVE",
        estimatedArrival: {
          lte: expect.any(Date),
        },
      },
    })
  );

  expect(findJourney).toHaveBeenCalledTimes(2);
});
});