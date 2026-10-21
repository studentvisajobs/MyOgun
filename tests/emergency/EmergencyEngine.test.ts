
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  networkCallback: null as ((status: "ONLINE" | "OFFLINE") => void) | null,
  updateEmergencySession: vi.fn(),
  getActiveEmergencySession: vi.fn(),
}));

vi.mock("../../lib/emergency/EmergencyBattery", () => ({
  getEmergencyBatteryLevel: vi.fn().mockResolvedValue(80),
}));

vi.mock("../../lib/emergency/EmergencyGPS", () => ({
  getEmergencyGPS: vi.fn().mockResolvedValue({
    latitude: 53.5,
    longitude: -2.6,
    accuracy: 10,
  }),
  watchEmergencyGPS: vi.fn().mockReturnValue(1),
  stopEmergencyGPSWatch: vi.fn(),
}));

vi.mock("../../lib/emergency/EmergencyNetwork", () => ({
  getEmergencyNetworkStatus: vi.fn().mockReturnValue("ONLINE"),
  watchEmergencyNetwork: vi.fn((callback) => {
    mocks.networkCallback = callback;
    callback("ONLINE");
    return vi.fn();
  }),
}));

vi.mock("../../lib/emergency/EmergencySession", () => ({
  startEmergencySession: vi.fn(),
  stopEmergencySession: vi.fn(),
  updateEmergencySession: mocks.updateEmergencySession,
  getActiveEmergencySession: mocks.getActiveEmergencySession,
}));

vi.mock("../../lib/emergency/EmergencyTimeline", () => ({
  createEmergencyTimelineEvent: vi.fn((message: string) => ({
    time: new Date().toISOString(),
    message,
  })),
}));

import { EmergencyEngine } from "../../lib/emergency/EmergencyEngine";

describe("EmergencyEngine network reconnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.networkCallback = null;

    mocks.getActiveEmergencySession.mockResolvedValue({
      success: true,
      session: {
        id: "emergency-test-1",
        guardianSessionId: "guardian-test-1",
        status: "ACTIVE",
        latitude: 53.5,
        longitude: -2.6,
        battery: 80,
        network: "ONLINE",
        startedAt: new Date().toISOString(),
      },
    });

    mocks.updateEmergencySession.mockResolvedValue({
      success: true,
    });
  });

  it("synchronizes the latest location after OFFLINE to ONLINE", async () => {
    const engine = new EmergencyEngine({
      mode: "SILENT_SOS",
      onStatus: vi.fn(),
      onTimeline: vi.fn(),
      onLocation: vi.fn(),
      onBattery: vi.fn(),
      onSession: vi.fn(),
    });

    expect(await engine.resume()).toBe(true);

    expect(mocks.networkCallback).not.toBeNull();

    // Initial ONLINE status must not trigger an update.
    expect(mocks.updateEmergencySession).not.toHaveBeenCalled();

    mocks.networkCallback?.("OFFLINE");
    mocks.networkCallback?.("ONLINE");

    await vi.waitFor(() => {
      expect(mocks.updateEmergencySession).toHaveBeenCalledTimes(1);
    });

    expect(mocks.updateEmergencySession).toHaveBeenCalledWith(
      "emergency-test-1",
      "Location synchronised after network reconnection.",
      expect.objectContaining({
        latitude: 53.5,
        longitude: -2.6,
      }),
      80,
      "ONLINE"
    );

    engine.dispose();
  });
});
