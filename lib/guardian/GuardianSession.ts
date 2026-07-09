import type { GuardianLocation } from "./GuardianGPS";

export type GuardianSessionResponse = {
  session: {
    id: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    batteryLevel: number | null;
    networkStatus: string | null;
  };
};

export async function startGuardianSession(
  location?: GuardianLocation | null,
  batteryLevel?: number | null,
  networkStatus?: string
) {
  const res = await fetch("/api/guardian/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracy: location?.accuracy ?? null,
      batteryLevel: batteryLevel ?? null,
      networkStatus: networkStatus || "UNKNOWN",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to start Guardian session.");
  }

  return data as GuardianSessionResponse;
}

export async function updateGuardianSession(
  sessionId: string,
  message: string,
  location?: GuardianLocation | null,
  batteryLevel?: number | null,
  networkStatus?: string
) {
  const res = await fetch("/api/guardian/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      message,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracy: location?.accuracy ?? null,
      batteryLevel: batteryLevel ?? null,
      networkStatus: networkStatus || "UNKNOWN",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update Guardian session.");
  }

  return data as GuardianSessionResponse;
}

export async function stopGuardianSession(sessionId: string) {
  const res = await fetch("/api/guardian/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to stop Guardian session.");
  }

  return data as GuardianSessionResponse;
}