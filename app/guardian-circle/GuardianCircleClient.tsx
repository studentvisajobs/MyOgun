"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

type Guardian = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relation: string | null;
  isPrimary: boolean;
};

type SharedLocation = {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  batteryLevel: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
} | null;

type Props = {
  guardians: Guardian[];
  myLocation: SharedLocation;
};

const GuardianCircleMap = dynamic(() => import("./GuardianCircleMap"), {
  ssr: false,
});

function timeAgo(value: string | Date | null | undefined) {
  if (!value) return "Not shared yet";

  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

function locationStatus(updatedAt?: string | Date | null) {
  if (!updatedAt) return "OFFLINE";

  const minutes = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / 60000
  );

  if (minutes <= 2) return "ONLINE";
  if (minutes <= 15) return "RECENT";
  return "OFFLINE";
}

export default function GuardianCircleClient({
  guardians,
  myLocation,
}: Props) {
  const [location, setLocation] = useState(myLocation);
  const [sharing, setSharing] = useState(
    myLocation ? locationStatus(myLocation.updatedAt) === "ONLINE" : false
  );
  const [statusText, setStatusText] = useState("");

  const lastUploadRef = useRef<number>(0);

  const status = locationStatus(location?.updatedAt);
  const connected = guardians.length;
  const safeCount = status === "ONLINE" ? connected + 1 : connected;

  useEffect(() => {
    let watchId: number | null = null;

    if (!sharing) return;

    if (!navigator.geolocation) {
      setStatusText("GPS is not available on this device.");
      setSharing(false);
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();

        if (now - lastUploadRef.current < 10000) {
          return;
        }

        lastUploadRef.current = now;

        try {
          const res = await fetch("/api/location/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            setLocation(data.location);
            setStatusText("Live location updated.");
          } else {
            setStatusText(data.error || "Unable to share location.");
          }
        } catch {
          setStatusText("Unable to reach server. Check your internet connection.");
        }
      },
      () => {
        setStatusText("Location permission denied.");
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [sharing]);

  return (
    <>
      <section className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
        <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
          CIRCLE STATUS
        </p>

        <h2 className="mt-3 text-3xl font-black">
          {connected} Guardian{connected === 1 ? "" : "s"} Connected
        </h2>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">
              {safeCount}
            </p>
            <p className="mt-1 text-xs text-white/50">Safe</p>
          </div>

          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-yellow-300">0</p>
            <p className="mt-1 text-xs text-white/50">Travelling</p>
          </div>

          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-red-400">0</p>
            <p className="mt-1 text-xs text-white/50">Emergency</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
              MY STATUS
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {status === "ONLINE"
                ? "Location Sharing On"
                : "Share My Location"}
            </h2>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-xs font-black ${
              status === "ONLINE"
                ? "bg-emerald-500 text-black"
                : status === "RECENT"
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-white/60"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-white/60">
            {location
              ? `📍 ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
              : "📍 No location shared yet"}
          </p>

          <p className="mt-2 text-sm text-white/40">
            {timeAgo(location?.updatedAt)}
          </p>

          {location?.accuracy != null && (
            <p className="mt-2 text-sm text-white/40">
              Accuracy: {Math.round(location.accuracy)}m
            </p>
          )}

          {location?.batteryLevel != null && (
            <p className="mt-2 text-sm text-white/40">
              Battery: {location.batteryLevel}%
            </p>
          )}
        </div>

        {statusText && (
          <p className="mt-4 text-sm text-white/60">{statusText}</p>
        )}

        <button
          onClick={() => {
            setStatusText("");
            setSharing((old) => !old);
          }}
          className={`mt-5 w-full rounded-full py-4 font-black ${
            sharing ? "bg-red-500 text-white" : "bg-emerald-500 text-black"
          }`}
        >
          {sharing ? "Stop Sharing" : "Start Live Sharing"}
        </button>
      </section>

      <GuardianCircleMap
        myLocation={
          location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                updatedAt: String(location.updatedAt),
              }
            : null
        }
        guardians={guardians.map((guardian) => ({
          id: guardian.id,
          name: guardian.name,
          relation: guardian.relation,
        }))}
      />

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Trusted Guardians</h2>

          <Link
            href="/guardian-circle/add"
            className="rounded-full border border-emerald-500/30 px-4 py-2 text-xs font-black text-emerald-400"
          >
            Add
          </Link>
        </div>

        <div className="mt-5 space-y-4">
          {guardians.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5 text-center">
              <p className="text-5xl">👥</p>

              <h3 className="mt-4 text-2xl font-black">No Guardians Yet</h3>

              <p className="mt-2 text-sm text-white/60">
                Add trusted people who can receive your emergency alerts and
                location updates.
              </p>

              <Link
                href="/guardian-circle/add"
                className="mt-5 inline-block rounded-full bg-emerald-500 px-6 py-3 font-black text-black"
              >
                Add Guardian
              </Link>
            </div>
          ) : (
            guardians.map((guardian) => (
              <div
                key={guardian.id}
                className="rounded-[2rem] border border-white/10 bg-black/30 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
                    👤
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{guardian.name}</h3>

                        <p className="mt-1 text-sm text-emerald-400">
                          🟢 Trusted Guardian
                        </p>
                      </div>

                      {guardian.isPrimary && (
                        <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-[#111] p-3">
                        <p className="text-white/40">Phone</p>
                        <p className="mt-1 font-bold">{guardian.phone}</p>
                      </div>

                      <div className="rounded-2xl bg-[#111] p-3">
                        <p className="text-white/40">Relation</p>
                        <p className="mt-1 font-bold">
                          {guardian.relation || "Trusted"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-[#111] p-3">
                      <p className="text-sm text-white/50">
                        📍 Live location will appear when this guardian shares
                        location with you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4">
        <Link
          href="/guardian-mode"
          className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5 text-center transition active:scale-95"
        >
          <p className="text-4xl">🛡️</p>
          <p className="mt-3 font-black">Guardian Mode</p>
        </Link>

        <Link
          href="/silent-sos"
          className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5 text-center transition active:scale-95"
        >
          <p className="text-4xl">🚨</p>
          <p className="mt-3 font-black">Silent SOS</p>
        </Link>
      </section>
    </>
  );
}