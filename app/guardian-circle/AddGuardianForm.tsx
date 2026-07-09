"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function GuardianModeClient() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [alertId, setAlertId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active]);

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  async function startGuardianMode() {
    setMessage("Requesting location permission...");

    if (!navigator.geolocation) {
      setMessage("GPS is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({ latitude, longitude });

        const res = await fetch("/api/guardian-mode", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude,
            longitude,
            message: "Guardian Mode activated",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessage(data.error || "Failed to activate Guardian Mode.");
          return;
        }

        setAlertId(data.alert.id);
        setActive(true);
        setSeconds(0);
        setMessage("Guardian Mode is active. Your location is being monitored.");

        watchRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            setLocation({
              latitude: lat,
              longitude: lng,
            });

            await fetch("/api/guardian-mode", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                alertId: data.alert.id,
                latitude: lat,
                longitude: lng,
              }),
            });
          },
          () => {
            setMessage("Guardian Mode active, but GPS update failed.");
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );
      },
      () => {
        setMessage("Location permission was denied.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function stopGuardianMode() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (alertId) {
      await fetch("/api/guardian-mode", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertId,
        }),
      });
    }

    setActive(false);
    setAlertId(null);
    setMessage("Guardian Mode stopped safely.");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold text-emerald-400">
          ← Back to Home
        </Link>

        <section className="mt-10 rounded-[2rem] border border-emerald-500/20 bg-white/5 p-8 text-center shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-emerald-400">
            MyOgun
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Guardian Mode
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Activate personal protection. MyOgun will track your live location
            and prepare your Guardian Circle for emergency response.
          </p>

          <div
            className={`mx-auto mt-10 flex h-56 w-56 items-center justify-center rounded-full border text-center ${
              active
                ? "animate-pulse border-red-500 bg-red-500/20"
                : "border-emerald-500 bg-emerald-500/10"
            }`}
          >
            <div>
              <p className="text-5xl font-black">
                {active ? "🛡️" : "🟢"}
              </p>
              <p className="mt-3 text-xl font-black">
                {active ? "ACTIVE" : "READY"}
              </p>
              <p className="mt-2 text-sm text-white/60">
                {active ? formatTime(seconds) : "Tap to start"}
              </p>
            </div>
          </div>

          <div className="mt-10">
            {!active ? (
              <button
                onClick={startGuardianMode}
                className="rounded-full bg-emerald-500 px-10 py-4 text-lg font-black text-black transition hover:bg-emerald-400"
              >
                Activate Guardian Mode
              </button>
            ) : (
              <button
                onClick={stopGuardianMode}
                className="rounded-full bg-red-600 px-10 py-4 text-lg font-black text-white transition hover:bg-red-500"
              >
                Stop Guardian Mode
              </button>
            )}
          </div>

          {message && (
            <p className="mx-auto mt-6 max-w-xl rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white/70">
              {message}
            </p>
          )}

          {location && (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-left">
              <p className="font-bold text-emerald-300">Live GPS</p>
              <p className="mt-2 text-sm text-white/70">
                Latitude: {location.latitude}
              </p>
              <p className="text-sm text-white/70">
                Longitude: {location.longitude}
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-2xl">📍</p>
            <h3 className="mt-3 font-black">Live Tracking</h3>
            <p className="mt-2 text-sm text-white/60">
              Location updates while Guardian Mode is active.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-2xl">👥</p>
            <h3 className="mt-3 font-black">Guardian Circle</h3>
            <p className="mt-2 text-sm text-white/60">
              Your trusted contacts will power emergency response.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-2xl">🎥</p>
            <h3 className="mt-3 font-black">Evidence Ready</h3>
            <p className="mt-2 text-sm text-white/60">
              Emergency recording will be added into this flow next.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}