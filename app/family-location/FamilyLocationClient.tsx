"use client";

import { useState } from "react";

export default function FamilyLocationClient() {
  const [status, setStatus] = useState("Location sharing is off.");
  const [sharing, setSharing] = useState(false);

  function startSharing() {
    if (!navigator.geolocation) {
      setStatus("GPS is not available on this device.");
      return;
    }

    setStatus("Starting location sharing...");
    setSharing(true);

    navigator.geolocation.watchPosition(
      async (position) => {
        await fetch("/api/location/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        });

        setStatus("Live location shared just now.");
      },
      () => {
        setStatus("Location permission denied.");
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );
  }

  return (
    <section className="rounded-[2rem] border border-emerald-500/20 bg-[#111] p-6">
      <div className="text-5xl">📍</div>

      <h2 className="mt-4 text-3xl font-black">
        {sharing ? "Location Sharing On" : "Share My Location"}
      </h2>

      <p className="mt-3 text-white/60">{status}</p>

      <button
        onClick={startSharing}
        disabled={sharing}
        className="mt-6 w-full rounded-full bg-emerald-500 py-4 font-black text-black disabled:opacity-50"
      >
        {sharing ? "Sharing..." : "Start Sharing"}
      </button>
    </section>
  );
}