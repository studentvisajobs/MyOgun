"use client";

import { useEffect, useState } from "react";

type Props = {
  latitude: number | null;
  longitude: number | null;
  setLatitude: (value: number | null) => void;
  setLongitude: (value: number | null) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function LocationStep({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  onNext,
  onBack,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported on this device.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLoading(false);
      },
      () => {
        setError("Location permission is needed to continue.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  }

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasLocation = latitude !== null && longitude !== null;

  return (
    <section className="mt-8">
      <h1 className="text-4xl font-black">Incident Location</h1>

      <p className="mt-3 text-white/60">
        MyOgun needs the incident location so nearby users can be alerted
        correctly.
      </p>

      <button
        type="button"
        onClick={getLocation}
        disabled={loading}
        className="mt-6 w-full rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 text-left disabled:opacity-50"
      >
        <p className="text-4xl">📍</p>

        <h2 className="mt-4 text-2xl font-black">
          {loading ? "Getting Location..." : "Use My Current Location"}
        </h2>

        <p className="mt-2 text-sm text-white/60">
          {hasLocation
            ? "GPS locked successfully."
            : "Allow location permission to continue."}
        </p>
      </button>

      {error && (
        <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-300">
          ⚠ {error}
        </div>
      )}

      {hasLocation && (
        <div className="mt-5 rounded-[2rem] border border-emerald-500/20 bg-[#111] p-5 text-white/70">
          <p className="font-black text-emerald-400">✅ GPS Locked</p>
          <p className="mt-3">Latitude: {latitude.toFixed(6)}</p>
          <p className="mt-1">Longitude: {longitude.toFixed(6)}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 py-4 font-black text-white"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasLocation}
          className={`rounded-full py-4 font-black transition ${
            hasLocation
              ? "bg-emerald-500 text-black"
              : "cursor-not-allowed bg-white/10 text-white/40"
          }`}
        >
          Continue
        </button>
      </div>
    </section>
  );
}