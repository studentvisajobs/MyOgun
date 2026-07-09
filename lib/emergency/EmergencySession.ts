import type { EmergencyLocation, EmergencyMode } from "./EmergencyTypes";

export type EmergencySessionResponse = {
  session: {
    id: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    battery: number | null;
    network: string | null;
  };
};

export async function startEmergencySession(
  mode: EmergencyMode,
  location?: EmergencyLocation | null,
  batteryLevel?: number | null,
  networkStatus?: string
) {
  const res = await fetch("/api/guardian/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      battery: batteryLevel ?? null,
      network: networkStatus || "UNKNOWN",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to start emergency session.");
  }

  return data as EmergencySessionResponse;
}

export async function updateEmergencySession(
  sessionId: string,
  message: string,
  location?: EmergencyLocation | null,
  batteryLevel?: number | null,
  networkStatus?: string
) {
  const res = await fetch("/api/guardian/update-location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update emergency session.");
  }

  return data as EmergencySessionResponse;
}

export async function stopEmergencySession(sessionId: string) {
  const res = await fetch("/api/guardian/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to stop emergency session.");
  }

  return data as EmergencySessionResponse;
}