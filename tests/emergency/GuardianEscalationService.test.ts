
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findJourneys,
  findCurrentJourney,
  updateJourney,
  createTimeline,
  getAuthorizedGuardianIds,
  getOrCreateJourneyNotification,
  sendToGuardian,
} = vi.hoisted(() => ({
  findJourneys: vi.fn(),
  findCurrentJourney: vi.fn(),
  updateJourney: vi.fn(),
  createTimeline: vi.fn(),
  getAuthorizedGuardianIds: vi.fn(),
  getOrCreateJourneyNotification: vi.fn(),
  sendToGuardian: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    safeJourney: {
      findMany: findJourneys,
      findFirst: findCurrentJourney,
      updateMany: updateJourney,
    },
    safeJourneyTimeline: {
      create: createTimeline,
    },
  },
}));

vi.mock("@/lib/services/GuardianRecipientService", () => ({
  GuardianRecipientService: {
    getAuthorizedGuardianIds,
  },
}));

vi.mock("@/lib/notifications/EmergencyNotificationService", () => ({
  EmergencyNotificationService: {
    getOrCreateJourneyNotification,
    sendToGuardian,
  },
}));

import { GuardianEscalationService } from "../../lib/services/GuardianEscalationService";

const overdueJourney = {
  id: "journey-test-1",
  userId: "user-test-1",
  destination: "Manchester",
  escalatedAt: null,
};

describe("GuardianEscalationService", () => {
    beforeEach(() => {
    vi.resetAllMocks();

    findJourneys.mockResolvedValue([overdueJourney]);

    findCurrentJourney
    .mockResolvedValueOnce({
        id: overdueJourney.id,
        escalatedAt: null,
    })
    .mockResolvedValue({
        id: overdueJourney.id,
        escalatedAt: new Date("2026-10-29T10:00:00.000Z"),
    });
    updateJourney.mockResolvedValue({ count: 1 });
    createTimeline.mockResolvedValue({});
    getAuthorizedGuardianIds.mockResolvedValue(["guardian-test-1"]);
    getOrCreateJourneyNotification.mockResolvedValue({
      id: "notification-test-1",
    });
    sendToGuardian.mockResolvedValue({
    attempted: true,
    accepted: true,
    });
    });

    it("creates a fresh notification cycle after a journey is extended", async () => {
  const firstCycle = new Date("2026-10-29T10:00:00.000Z");
  const secondCycle = new Date("2026-10-29T11:00:00.000Z");

  findCurrentJourney.mockReset();

  findCurrentJourney
    .mockResolvedValueOnce({
      id: overdueJourney.id,
      escalatedAt: firstCycle,
    })
    .mockResolvedValueOnce({
      id: overdueJourney.id,
      escalatedAt: firstCycle,
    })
    .mockResolvedValueOnce({
      id: overdueJourney.id,
      escalatedAt: null,
    })
    .mockResolvedValueOnce({
      id: overdueJourney.id,
      escalatedAt: secondCycle,
    });

    await GuardianEscalationService.run();

    expect(getOrCreateJourneyNotification).toHaveBeenLastCalledWith(
        expect.objectContaining({
        escalationCycleId: firstCycle.toISOString(),
        })
    );

    findJourneys.mockResolvedValue([
        { ...overdueJourney, escalatedAt: null },
    ]);

    await GuardianEscalationService.run();

    expect(getOrCreateJourneyNotification).toHaveBeenLastCalledWith(
        expect.objectContaining({
        escalationCycleId: secondCycle.toISOString(),
        })
    );

    expect(sendToGuardian).toHaveBeenCalledTimes(2);
    });

    it("queues and sends an alert to an authorised guardian", async () => {
    const result = await GuardianEscalationService.run();

    expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
      "user-test-1"
    );

    expect(getOrCreateJourneyNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        guardianUserId: "guardian-test-1",
        journeyId: "journey-test-1",
      })
    );

    expect(sendToGuardian).toHaveBeenCalledOnce();
    expect(result.escalated).toBe(1);
  });

  it("does not escalate when no authorised guardians exist", async () => {
    getAuthorizedGuardianIds.mockResolvedValue([]);

    const result = await GuardianEscalationService.run();

    expect(sendToGuardian).not.toHaveBeenCalled();
    expect(updateJourney).not.toHaveBeenCalled();
    expect(result.escalated).toBe(0);
  });

    it("does not send alerts when a journey is no longer overdue", async () => {
    findCurrentJourney.mockReset();
    findCurrentJourney.mockResolvedValue(null);

    const result = await GuardianEscalationService.run();

    expect(sendToGuardian).not.toHaveBeenCalled();
    expect(result.escalated).toBe(0);
  });

  it("reuses notification records for previously escalated journeys", async () => {
    findJourneys.mockResolvedValue([
      {
        ...overdueJourney,
        escalatedAt: new Date(),
      },
    ]);

    findCurrentJourney.mockReset();
    findCurrentJourney.mockResolvedValue({
    id: overdueJourney.id,
    escalatedAt: new Date("2026-10-29T10:00:00.000Z"),
    });

    const result = await GuardianEscalationService.run();

    expect(getOrCreateJourneyNotification).toHaveBeenCalled();
    expect(updateJourney).not.toHaveBeenCalled();
    expect(sendToGuardian).toHaveBeenCalledOnce();
    expect(result.escalated).toBe(0);
  });

  it("does not send when the final overdue check fails", async () => {
    findCurrentJourney
      .mockResolvedValueOnce({
        id: overdueJourney.id,
        escalatedAt: null,
      })
      .mockResolvedValueOnce(null);

    await GuardianEscalationService.run();

    expect(sendToGuardian).not.toHaveBeenCalled();
  });

  it("does not stop processing when a notification delivery fails", async () => {
    sendToGuardian.mockRejectedValue(
      new Error("Simulated Firebase failure")
    );

    const result = await GuardianEscalationService.run();

    expect(result.checked).toBe(1);
    expect(result.escalated).toBe(1);
    expect(sendToGuardian).toHaveBeenCalledOnce();
  });
});
