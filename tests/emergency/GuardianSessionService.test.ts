import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUser,
  findUsers,
  findSession,
  findDashboardSession,
  findResponder,
  updateResponder,
  createTimeline,
  getAuthorizedGuardianIds,
  transaction,
} = vi.hoisted(() => ({
  findUser: vi.fn(),
  findSession: vi.fn(),
  findResponder: vi.fn(),
  updateResponder: vi.fn(),
  createTimeline: vi.fn(),
  getAuthorizedGuardianIds: vi.fn(),
  findUsers: vi.fn(),
  findDashboardSession: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/services/GuardianSessionLock", () => ({
  lockGuardianSessionUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transaction,
    user: {
    findUnique: findUser,
    findMany: findUsers,
    },
    guardianSession: {
    findUnique: findSession,
    findFirst: findDashboardSession,
    },
    emergencyResponder: {
      findFirst: findResponder,
      update: updateResponder,
    },
    guardianSessionTimeline: {
      create: createTimeline,
    },
  },
}));

vi.mock("@/lib/services/GuardianRecipientService", () => ({
  GuardianRecipientService: {
    getAuthorizedGuardianIds,
  },
}));

import { GuardianSessionService } from "../../lib/services/GuardianSessionService";

describe("GuardianSessionService authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();


    transaction.mockImplementation(async (callback) => {
      return callback({
        user: {
          findUnique: findUser,
          findMany: findUsers,
        },
        guardianSession: {
          findUnique: findSession,
          findFirst: findDashboardSession,
        },
        emergencyResponder: {
          findFirst: findResponder,
          update: updateResponder,
        },
        guardianSessionTimeline: {
          create: createTimeline,
        },
      });
    });


    findUser.mockResolvedValue({
      id: "guardian-1",
      phone: "+447700900123",
    });

    findSession.mockResolvedValue({
      id: "session-1",
      userId: "owner-1",
      status: "ACTIVE",
      latitude: 53.48,
      longitude: -2.24,
    });

    findResponder.mockResolvedValue({
      id: "responder-1",
      sessionId: "session-1",
      guardianPhone: "+447700900123",
      guardianName: "Test Guardian",
      status: "PENDING",
      viewedAt: null,
    });

    updateResponder.mockResolvedValue({
      id: "responder-1",
      guardianName: "Test Guardian",
      status: "RESPONDING",
    });

    createTimeline.mockResolvedValue({});

    getAuthorizedGuardianIds.mockResolvedValue(["guardian-1"]);
  });
    it("rejects a removed guardian attempting to respond", async () => {
    // Simulate a guardian who has been removed from the Guardian Circle.
    getAuthorizedGuardianIds.mockResolvedValue([]);

    await expect(
      GuardianSessionService.respond("session-1", "guardian-1"),
    ).rejects.toMatchObject({
      status: 403,
      message: "You are no longer authorized to respond to this emergency.",
    });

    // Authorization must be checked before accessing responder records.
    expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
      "owner-1",
      expect.any(Object),
    );
    expect(findResponder).not.toHaveBeenCalled();
    expect(updateResponder).not.toHaveBeenCalled();
    expect(createTimeline).not.toHaveBeenCalled();
  });
    it("allows an authorized guardian to respond", async () => {
    const result = await GuardianSessionService.respond(
      "session-1",
      "guardian-1",
    );

    expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
      "owner-1",
      expect.any(Object),
    );

    expect(findResponder).toHaveBeenCalledWith({
      where: {
        sessionId: "session-1",
        guardianPhone: "+447700900123",
      },
    });

    expect(updateResponder).toHaveBeenCalledWith({
      where: {
        id: "responder-1",
      },
      data: {
        status: "RESPONDING",
        viewedAt: expect.any(Date),
        respondingAt: expect.any(Date),
      },
    });

    expect(createTimeline).toHaveBeenCalledOnce();

    expect(result.status).toBe("RESPONDING");
  });
    it("rejects a removed guardian attempting to mark arrival", async () => {
    // Simulate a guardian who has been removed.
    getAuthorizedGuardianIds.mockResolvedValue([]);

    // Simulate a historical responder who was previously responding.
    findResponder.mockResolvedValue({
      id: "responder-1",
      sessionId: "session-1",
      guardianPhone: "+447700900123",
      guardianName: "Test Guardian",
      status: "RESPONDING",
      viewedAt: new Date(),
      respondingAt: new Date(),
    });

    await expect(
      GuardianSessionService.arrive("session-1", "guardian-1"),
    ).rejects.toMatchObject({
      status: 403,
      message: "You are no longer authorized to respond to this emergency.",
    });

    expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
      "owner-1",
      expect.any(Object),
    );

    // A removed guardian must not access or update responder records.
    expect(findResponder).not.toHaveBeenCalled();
    expect(updateResponder).not.toHaveBeenCalled();
    expect(createTimeline).not.toHaveBeenCalled();
  });
    it("allows an authorized guardian to mark arrival", async () => {
    findResponder.mockResolvedValue({
      id: "responder-1",
      sessionId: "session-1",
      guardianPhone: "+447700900123",
      guardianName: "Test Guardian",
      status: "RESPONDING",
      viewedAt: new Date(),
      respondingAt: new Date(),
    });

    updateResponder.mockResolvedValue({
      id: "responder-1",
      guardianName: "Test Guardian",
      status: "ARRIVED",
    });

    const result = await GuardianSessionService.arrive(
      "session-1",
      "guardian-1",
    );

    expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
      "owner-1",
      expect.any(Object),
    );

    expect(updateResponder).toHaveBeenCalledWith({
      where: {
        id: "responder-1",
      },
      data: {
        status: "ARRIVED",
        viewedAt: expect.any(Date),
        respondingAt: expect.any(Date),
        arrivedAt: expect.any(Date),
      },
    });

    expect(createTimeline).toHaveBeenCalledOnce();
    expect(result.status).toBe("ARRIVED");
  });
  it("rejects dashboard access when the session does not belong to the user", async () => {
  findDashboardSession.mockResolvedValue(null);

  await expect(
    GuardianSessionService.getDashboard(
      "session-1",
      "unauthorized-user"
    )
  ).rejects.toMatchObject({
    status: 404,
    message: "Guardian session not found.",
  });

  expect(findDashboardSession).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "session-1",
        userId: "unauthorized-user",
      },
    })
  );

  expect(getAuthorizedGuardianIds).not.toHaveBeenCalled();
  expect(findUsers).not.toHaveBeenCalled();
});
it("preserves former guardians as historical responders", async () => {
  findDashboardSession.mockResolvedValue({
    id: "session-1",
    userId: "owner-1",
    status: "ACTIVE",
    user: {
      id: "owner-1",
      name: "Session Owner",
      phone: "+447700900000",
    },
    locations: [],
    timeline: [],
    responders: [
      {
        id: "responder-current",
        guardianName: "Current Guardian",
        guardianPhone: "+447700900123",
        status: "RESPONDING",
      },
      {
        id: "responder-former",
        guardianName: "Former Guardian",
        guardianPhone: "+447700900456",
        status: "ARRIVED",
      },
    ],
    evidence: [],
    acknowledgements: [],
  });

  getAuthorizedGuardianIds.mockResolvedValue(["guardian-1"]);

  findUsers.mockResolvedValue([
    { phone: "+447700900123" },
  ]);

  const dashboard = await GuardianSessionService.getDashboard(
    "session-1",
    "owner-1"
  );

  expect(dashboard.responders).toEqual([
    expect.objectContaining({
      id: "responder-current",
      isCurrentlyAuthorized: true,
    }),
    expect.objectContaining({
      id: "responder-former",
      isCurrentlyAuthorized: false,
    }),
  ]);

  expect(dashboard.summary.responderCount).toBe(1);

  expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
    "owner-1"
  );
});
  it("rejects a response after the emergency has stopped", async () => {
    findSession.mockResolvedValue({
      id: "session-1",
      userId: "owner-1",
      status: "STOPPED",
      latitude: 53.48,
      longitude: -2.24,
    });

    await expect(
      GuardianSessionService.respond("session-1", "guardian-1"),
    ).rejects.toMatchObject({
      status: 400,
      message: "Guardian session is not active.",
    });

    expect(updateResponder).not.toHaveBeenCalled();
    expect(createTimeline).not.toHaveBeenCalled();
    expect(getAuthorizedGuardianIds).not.toHaveBeenCalled();
  });

  it("rejects guardian arrival after the emergency has stopped", async () => {
    findSession.mockResolvedValue({
      id: "session-1",
      userId: "owner-1",
      status: "STOPPED",
      latitude: 53.48,
      longitude: -2.24,
    });

    findResponder.mockResolvedValue({
      id: "responder-1",
      sessionId: "session-1",
      guardianPhone: "+447700900123",
      status: "RESPONDING",
    });

    await expect(
      GuardianSessionService.arrive("session-1", "guardian-1"),
    ).rejects.toMatchObject({
      status: 400,
      message: "Guardian session is not active.",
    });

    expect(findResponder).not.toHaveBeenCalled();
    expect(updateResponder).not.toHaveBeenCalled();
    expect(createTimeline).not.toHaveBeenCalled();
  });
  it("propagates a timeline failure during guardian response", async () => {
    createTimeline.mockRejectedValue(
      new Error("Simulated timeline database failure"),
    );

    await expect(
      GuardianSessionService.respond("session-1", "guardian-1"),
    ).rejects.toThrow("Simulated timeline database failure");

    expect(transaction).toHaveBeenCalledOnce();
    expect(updateResponder).toHaveBeenCalledOnce();
    expect(createTimeline).toHaveBeenCalledOnce();
  });
});