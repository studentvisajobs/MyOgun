
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { runMonitor } = vi.hoisted(() => ({
  runMonitor: vi.fn(),
}));

vi.mock("@/lib/services/JourneyMonitor", () => ({
  JourneyMonitor: {
    run: runMonitor,
  },
}));

import { POST } from "../../app/api/system/journey-monitor/route";

describe("Journey monitor endpoint security", () => {
  const originalSecret = process.env.JOURNEY_MONITOR_SECRET;
  const testSecret = "test-only-monitoring-secret";

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JOURNEY_MONITOR_SECRET = testSecret;

    runMonitor.mockResolvedValue({
      checked: 0,
      markedOverdue: 0,
      escalationChecked: 0,
      escalated: 0,
    });
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JOURNEY_MONITOR_SECRET;
    } else {
      process.env.JOURNEY_MONITOR_SECRET = originalSecret;
    }
  });

  it("rejects requests without authorization", async () => {
    const response = await POST(
      new Request("http://localhost/api/system/journey-monitor", {
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(runMonitor).not.toHaveBeenCalled();
  });

  it("rejects incorrect secrets", async () => {
    const response = await POST(
      new Request("http://localhost/api/system/journey-monitor", {
        method: "POST",
        headers: {
          Authorization: "Bearer incorrect-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    expect(runMonitor).not.toHaveBeenCalled();
  });

  it("accepts the correct secret", async () => {
    const response = await POST(
      new Request("http://localhost/api/system/journey-monitor", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testSecret}`,
        },
      })
    );

    expect(response.status).toBe(200);
    expect(runMonitor).toHaveBeenCalledOnce();
  });

  it("fails closed when the secret is missing", async () => {
    delete process.env.JOURNEY_MONITOR_SECRET;

    const response = await POST(
      new Request("http://localhost/api/system/journey-monitor", {
        method: "POST",
      })
    );

    expect(response.status).toBe(503);
    expect(runMonitor).not.toHaveBeenCalled();
  });
});
