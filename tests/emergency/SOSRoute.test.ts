
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUser,
  createSOS,
  createEmergencyNotification,
  getAuthorizedGuardianIds,
  notifyGuardians,
} = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSOS: vi.fn(),
  createEmergencyNotification: vi.fn(),
  getAuthorizedGuardianIds: vi.fn(),
  notifyGuardians: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sOSAlert: {
      create: createSOS,
    },
  },
}));

vi.mock("@/lib/services/NotificationService", () => ({
  NotificationService: {
    createEmergencyNotification,
  },
}));

vi.mock("@/lib/services/GuardianRecipientService", () => ({
  GuardianRecipientService: {
    getAuthorizedGuardianIds,
  },
}));

vi.mock("@/lib/notifications/NotificationService", () => ({
  NotificationService: {
    notifyGuardians,
  },
}));

import { POST } from "../../app/api/sos/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/sos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("SOS API endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    getCurrentUser.mockResolvedValue({
      id: "user-1",
      name: "Test User",
    });

    createSOS.mockResolvedValue({
      id: "sos-1",
      userId: "user-1",
    });

    createEmergencyNotification.mockResolvedValue({});
    getAuthorizedGuardianIds.mockResolvedValue([]);
  });

  it("requires authentication", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await POST(makeRequest({}));

    expect(response.status).toBe(401);
    expect(createSOS).not.toHaveBeenCalled();
    expect(notifyGuardians).not.toHaveBeenCalled();
  });

  it("notifies only authorised guardian IDs", async () => {
    getAuthorizedGuardianIds.mockResolvedValue(["guardian-1"]);

    const response = await POST(
      makeRequest({
        latitude: 53.4808,
        longitude: -2.2426,
      })
    );

    expect(response.status).toBe(200);

    expect(getAuthorizedGuardianIds).toHaveBeenCalledWith(
      "user-1"
    );

    expect(notifyGuardians).toHaveBeenCalledOnce();
    expect(notifyGuardians.mock.calls[0][0]).toEqual([
      "guardian-1",
    ]);
  });

  it("does not send guardian push when none are authorised", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(200);
    expect(notifyGuardians).not.toHaveBeenCalled();
  });

  it("records missing coordinates as unavailable", async () => {
    await POST(makeRequest({}));

    expect(createSOS).toHaveBeenCalledWith({
      data: expect.objectContaining({
        latitude: null,
        longitude: null,
      }),
    });
  });

  it("rejects out-of-range GPS values", async () => {
    await POST(
      makeRequest({
        latitude: 120,
        longitude: 250,
      })
    );

    expect(createSOS).toHaveBeenCalledWith({
      data: expect.objectContaining({
        latitude: null,
        longitude: null,
      }),
    });
  });
});
