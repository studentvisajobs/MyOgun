"use client";

import { useState } from "react";

type Incident = {
  id: string;
  title: string;
  type: string;
  status: string;
  confidenceScore: number;
  area: string | null;
  localGovernment: string | null;
  distanceKm: number;
};

export default function NearbyDangerPage() {
  const [status, setStatus] = useState("");
  const [incidents, setIncidents] = useState<Incident[]>([]);

  async function scanForDanger() {
    setStatus("Checking your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("Scanning nearby verified danger zones...");

        const response = await fetch(
          `/api/danger/nearby?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus(data.error || "Failed to scan nearby danger.");
          return;
        }

        setIncidents(data.nearbyIncidents);

        if (data.nearbyIncidents.length > 0) {
          setStatus("🚨 Danger detected nearby.");

          if ("vibrate" in navigator) {
            navigator.vibrate([800, 300, 800, 300, 800]);
          }
        } else {
          setStatus("✅ No verified danger detected within your alert radius.");
        }
      },
      () => {
        setStatus("Location permission denied.");
      }
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="font-bold text-emerald-400">
          ← Home
        </a>

        <h1 className="mt-8 text-5xl font-black">
          Nearby Danger Scan
        </h1>

        <p className="mt-3 text-white/60">
          MyOgun checks verified and critical incidents near your current
          location and warns you before you move closer to danger.
        </p>

        <button
          onClick={scanForDanger}
          className="mt-8 rounded-full bg-red-600 px-8 py-4 text-xl font-black text-white"
        >
          Scan Nearby Danger
        </button>

        {status && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            {status}
          </div>
        )}

        <div className="mt-8 space-y-5">
          {incidents.map((incident) => (
            <a
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block rounded-3xl border border-red-500/30 bg-red-500/10 p-6"
            >
              <p className="text-sm font-bold text-red-400">
                {incident.status} ALERT
              </p>

              <h2 className="mt-2 text-2xl font-black">
                {incident.title}
              </h2>

              <p className="mt-2 text-white/60">
                {incident.type.replaceAll("_", " ")} •{" "}
                {incident.confidenceScore}% confidence
              </p>

              <p className="mt-2 text-white/50">
                Distance: {incident.distanceKm.toFixed(2)} km away
              </p>

              <p className="mt-1 text-sm text-white/40">
                {incident.area || "Unknown area"}{" "}
                {incident.localGovernment
                  ? `• ${incident.localGovernment}`
                  : ""}
              </p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}