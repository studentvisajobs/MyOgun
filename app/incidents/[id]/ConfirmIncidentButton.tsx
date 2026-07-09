"use client";

import { useState } from "react";

export default function ConfirmIncidentButton({
  incidentId,
}: {
  incidentId: string;
}) {
  const [status, setStatus] = useState("");

  async function confirmIncident() {
    setStatus("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const response = await fetch(`/api/incidents/${incidentId}/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus(data.error || "Failed.");
          return;
        }

        setStatus(
          `Witness confirmed. Distance: ${data.distanceKm.toFixed(2)} km`
        );

        window.location.reload();
      },
      () => {
        setStatus("Location permission denied.");
      }
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={confirmIncident}
        className="rounded-full border border-emerald-400 px-5 py-3 font-bold text-emerald-400"
      >
        ✓ I Witnessed This
      </button>

      {status && <p className="mt-3 text-sm text-white/60">{status}</p>}
    </div>
  );
}