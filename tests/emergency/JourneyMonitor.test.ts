import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findExpiredJourneys,
  updateManyJourneys,
  createTimeline,
  runTransaction,
  runEscalation,
} = vi.hoisted(() => ({
  findExpiredJourneys: vi.fn(),
  updateManyJourneys: vi.fn(),
  createTimeline: vi.fn(),
  runTransaction: vi.fn(),
  runEscalation: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    safeJourney: {
      findMany: findExpiredJourneys,
    },
    $transaction: runTransaction,
  },
}));

vi.mock("@/lib/services/GuardianEscalationService", () => ({
  GuardianEscalationService: {
    run: runEscalation,
  },
}));

import { JourneyMonitor } from "../../lib/services/JourneyMonitor";

describe("JourneyMonitor", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    runTransaction.mockImplementation(async (callback) =>
      callback({
        safeJourney: {
          updateMany: updateManyJourneys,
        },
        safeJourneyTimeline: {
          create: createTimeline,
        },
      })
    );

    runEscalation.mockResolvedValue({
      checked: 0,
      escalated: 0,
    });
  });
  it("continues processing journeys when one update fails", async () => {
  findExpiredJourneys.mockResolvedValue([
    { id: "journey-failed" },
    { id: "journey-success" },
  ]);

  updateManyJourneys
    .mockRejectedValueOnce(new Error("Simulated database failure"))
    .mockResolvedValueOnce({ count: 1 });

  createTimeline.mockResolvedValue({ id: "timeline-1" });

  const result = await JourneyMonitor.run();

  expect(updateManyJourneys).toHaveBeenCalledTimes(2);
  expect(createTimeline).toHaveBeenCalledTimes(1);
  expect(runEscalation).toHaveBeenCalledTimes(1);

  expect(result).toMatchObject({
    checked: 2,
    markedOverdue: 1,
    escalationChecked: 0,
    escalated: 0,
  });
});
});