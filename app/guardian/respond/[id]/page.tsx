
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Emergency = {
  session: {
    id: string;
    status: string;
    startedAt: string;
    latitude: number | null;
    longitude: number | null;
    batteryLevel: number | null;
    networkStatus: string | null;
  };
  responder: {
    id: string;
    status: string;
    respondingAt: string | null;
    arrivedAt: string | null;
  };
};

export default function GuardianRespondPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [emergency, setEmergency] =
    useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEmergency() {
      try {
        const response = await fetch(
          `/api/guardian/session/${encodeURIComponent(sessionId)}/guardian-view`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load emergency."
          );
        }

        if (!cancelled) {
          setEmergency(data.emergency);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmergency();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function updateResponse(
    action: "respond" | "arrive"
  ) {
    if (!emergency || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/guardian/session/${encodeURIComponent(sessionId)}/${action}`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update response."
        );
      }

      setEmergency((current) =>
        current
          ? {
              ...current,
              responder: {
                ...current.responder,
                status: data.responder.status,
                respondingAt: data.responder.respondingAt,
                arrivedAt: data.responder.arrivedAt,
              },
            }
          : current
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update response."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="p-6">Loading emergency...</main>;
  }

  if (!emergency) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">
          Emergency unavailable
        </h1>
        <p role="alert">{error || "Access denied."}</p>
      </main>
    );
  }

  const { session, responder } = emergency;
  const isActive = session.status === "ACTIVE";
  const isResponding = responder.status === "RESPONDING";
  const hasResponded = [
    "RESPONDING",
    "ARRIVED",
    "COMPLETED",
  ].includes(responder.status);

  const hasLocation =
    session.latitude !== null &&
    session.longitude !== null;

  const mapUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${session.latitude},${session.longitude}`
      )}`
    : null;

  return (
    <main className="mx-auto max-w-xl p-6 space-y-5">
      <h1 className="text-2xl font-bold text-green-700">
        MyOgun Emergency Response
      </h1>

      <p className="font-semibold">
        Emergency status: {session.status}
      </p>

      <p>Started: {new Date(session.startedAt).toLocaleString()}</p>
      <p>Battery: {session.batteryLevel ?? "Unknown"}%</p>
      <p>Network: {session.networkStatus ?? "Unknown"}</p>
      <p>Your response: {responder.status}</p>

      {mapUrl ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded bg-green-700 p-3 text-center text-white"
        >
          View Emergency Location
        </a>
      ) : (
        <p>Emergency location is not yet available.</p>
      )}

      {!isActive && (
        <p>This emergency is no longer active.</p>
      )}

      {isActive && !hasResponded && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void updateResponse("respond")}
          className="w-full rounded bg-green-700 p-3 text-white disabled:opacity-50"
        >
          {busy ? "Please wait..." : "I'm Responding"}
        </button>
      )}

      {isActive && isResponding && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void updateResponse("arrive")}
          className="w-full rounded bg-blue-700 p-3 text-white disabled:opacity-50"
        >
          {busy ? "Please wait..." : "I've Arrived"}
        </button>
      )}

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </main>
  );
}
