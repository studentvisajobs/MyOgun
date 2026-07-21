import type {
  EmergencyLocation,
  EmergencyMode,
} from "./EmergencyTypes";

export type EmergencySessionResponse = {
  success: boolean;
  session: {
    id: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    batteryLevel: number | null;
    networkStatus: string | null;
    startedAt?: string;
    updatedAt?: string;
  };
};

async function readJsonResponse(response: Response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Emergency request failed."
    );
  }

  return data;
}

export async function startEmergencySession(
  mode: EmergencyMode,
  location?: EmergencyLocation | null,
  batteryLevel?: number | null,
  networkStatus?: string
) {
  const response = await fetch("/api/guardian/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      batteryLevel: batteryLevel ?? null,
      networkStatus: networkStatus || "UNKNOWN",
    }),
  });

  return (await readJsonResponse(
    response
  )) as EmergencySessionResponse;
}

export async function updateEmergencySession(
  sessionId: string,
  message: string,
  location?: EmergencyLocation | null,
  batteryLevel?: number | null,
  networkStatus?: string
) {
  const response = await fetch("/api/guardian/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

  return (await readJsonResponse(
    response
  )) as EmergencySessionResponse;
}

export async function stopEmergencySession(
  sessionId: string
) {
  const response = await fetch("/api/guardian/stop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
    }),
  });

  return (await readJsonResponse(
    response
  )) as EmergencySessionResponse;
}

export async function getActiveEmergencySession() {
  const response = await fetch(
    "/api/guardian/active",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return (await readJsonResponse(
    response
  )) as {
    success: boolean;
    session: EmergencySessionResponse["session"] | null;
  };
}