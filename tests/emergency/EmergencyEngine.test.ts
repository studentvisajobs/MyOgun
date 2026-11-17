
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBattery: vi.fn(),
  getGPS: vi.fn(),
  getNetwork: vi.fn(),
  startSession: vi.fn(),
  updateSession: vi.fn(),
  watchGPS: vi.fn(),
  watchNetwork: vi.fn(),
  getActiveSession: vi.fn(),
}));

vi.mock("@/lib/emergency/EmergencyBattery", () => ({
  getEmergencyBatteryLevel: mocks.getBattery,
}));

vi.mock("@/lib/emergency/EmergencyGPS", () => ({
  getEmergencyGPS: mocks.getGPS,
  watchEmergencyGPS: mocks.watchGPS,
  stopEmergencyGPSWatch: vi.fn(),
}));

vi.mock("@/lib/emergency/EmergencyNetwork", () => ({
  getEmergencyNetworkStatus: mocks.getNetwork,
  watchEmergencyNetwork: mocks.watchNetwork,
}));

vi.mock("@/lib/emergency/EmergencySession", () => ({
  getActiveEmergencySession: mocks.getActiveSession,
  startEmergencySession: mocks.startSession,
  updateEmergencySession: mocks.updateSession,
  stopEmergencySession: vi.fn(),
}));

import { EmergencyEngine } from "../../lib/emergency/EmergencyEngine";

describe("EmergencyEngine", () => {
  beforeEach(() => {
vi.resetAllMocks();
    mocks.getActiveSession.mockResolvedValue({
      success: true,
      session: null,
    });
    const storage = new Map<string, string>();

    vi.stubGlobal("window", {});

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),

      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),

      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),

      clear: vi.fn(() => {
        storage.clear();
      }),
    });

    mocks.getBattery.mockResolvedValue(80);
    mocks.getNetwork.mockReturnValue("ONLINE");
    mocks.watchGPS.mockReturnValue(1);
    mocks.watchNetwork.mockReturnValue(() => {});
    mocks.updateSession.mockResolvedValue({ success: true });

    mocks.startSession.mockResolvedValue({
      success: true,
      session: {
        id: "emergency-test-1",
        guardianSessionId: null,
        startedAt: new Date().toISOString(),
      },
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
    }));
  });

  it("starts SOS even when GPS is unavailable", async () => {
    mocks.getGPS.mockRejectedValue(
      new Error("GPS permission denied"),
    );

    const onStatus = vi.fn();
    const onLocation = vi.fn();
    const onSession = vi.fn();

    const engine = new EmergencyEngine({
      mode: "SILENT_SOS",
      onStatus,
      onLocation,
      onSession,
      onBattery: vi.fn(),
      onTimeline: vi.fn(),
    });

    await engine.start();

    expect(mocks.startSession).toHaveBeenCalledWith(
      "SILENT_SOS",
      null,
      80,
      "ONLINE",
    );

    expect(onLocation).not.toHaveBeenCalled();
    expect(onSession).toHaveBeenCalledWith(
      "emergency-test-1",
      null,
    );

    expect(onStatus).toHaveBeenCalledWith("ACTIVE");
    expect(onStatus).not.toHaveBeenCalledWith("ERROR");

    engine.dispose();
  });

  it("activates local emergency mode when GPS and internet are unavailable", async () => {
    mocks.getGPS.mockRejectedValue(
      new Error("GPS unavailable"),
    );

    mocks.getNetwork.mockReturnValue("OFFLINE");

    const onStatus = vi.fn();
    const onLocation = vi.fn();
    const onSession = vi.fn();
    const onTimeline = vi.fn();

    const engine = new EmergencyEngine({
      mode: "SILENT_SOS",
      onStatus,
      onLocation,
      onSession,
      onBattery: vi.fn(),
      onTimeline,
    });

    await engine.start();

    expect(mocks.startSession).not.toHaveBeenCalled();
    expect(onLocation).not.toHaveBeenCalled();
    expect(onSession).toHaveBeenCalledWith(null);
    expect(onStatus).toHaveBeenCalledWith("ACTIVE");
    expect(onStatus).not.toHaveBeenCalledWith("ERROR");
    const savedEmergency = localStorage.getItem(
      "myogun_offline_emergency",
    );

    expect(savedEmergency).not.toBeNull();

    const emergency = JSON.parse(savedEmergency!);

    expect(emergency).toMatchObject({
      mode: "SILENT_SOS",
      location: null,
      battery: 80,
      pendingSync: true,
    });

    expect(emergency.startedAt).toEqual(expect.any(String));
    engine.dispose();
  });

});
