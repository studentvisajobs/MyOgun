"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

type NetworkGuardian = {
  contactId: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  relation: string | null;
  isPrimary: boolean;

  registered: boolean;
  online: boolean;

  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;

  batteryLevel: number | null;
  networkStatus: string;
  lastSeen: string | null;

  guardianMode: {
    active: boolean;
    status: string | null;
    startedAt: string | null;
  };

  safeJourney: {
    active: boolean;
    status: string | null;
    destination: string | null;
    estimatedArrival: string | null;
    startedAt: string | null;
  };

  emergency: {
    active: boolean;
    status: string | null;
    silentSOS: boolean;
    guardianMode: boolean;
    safeJourney: boolean;
    startedAt: string | null;
  };
};

type GuardianNetworkResponse = {
  guardians: NetworkGuardian[];
  total: number;
  online: number;
};

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
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `Updated ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Updated ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `Updated ${days}d ago`;
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

function batteryLabel(level: number | null) {
  if (level === null) return "Unknown";

  return `${level}%`;
}

function batteryIcon(level: number | null) {
  if (level === null) return "🔋";
  if (level <= 15) return "🪫";
  return "🔋";
}

export default function GuardianCircleClient({
  guardians,
  myLocation,
}: Props) {
  const [location, setLocation] = useState(myLocation);
  const [sharing, setSharing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mounted, setMounted] = useState(false);

  const [networkGuardians, setNetworkGuardians] = useState<
    NetworkGuardian[]
  >([]);

  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState("");

  const lastUploadRef = useRef<number>(0);

  const status = mounted
    ? locationStatus(location?.updatedAt)
    : "OFFLINE";

  const loadGuardianNetwork = useCallback(async () => {
    try {
      const response = await fetch("/api/guardian-network", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as
        | GuardianNetworkResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Unable to load Guardian Network."
        );
      }

      const networkData = data as GuardianNetworkResponse;

      setNetworkGuardians(networkData.guardians ?? []);
      setNetworkError("");
    } catch (error) {
      setNetworkError(
        error instanceof Error
          ? error.message
          : "Unable to load Guardian Network."
      );
    } finally {
      setNetworkLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    if (
      myLocation &&
      locationStatus(myLocation.updatedAt) === "ONLINE"
    ) {
      setSharing(true);
    }
  }, [myLocation]);

  useEffect(() => {
    void loadGuardianNetwork();

    const intervalId = window.setInterval(() => {
      void loadGuardianNetwork();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadGuardianNetwork]);

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
            headers: {
              "Content-Type": "application/json",
            },
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
            setStatusText(
              data.error || "Unable to share location."
            );
          }
        } catch {
          setStatusText(
            "Unable to reach server. Check your internet connection."
          );
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

  const displayedGuardians =
    networkGuardians.length > 0
      ? networkGuardians
      : guardians.map<NetworkGuardian>((guardian) => ({
          contactId: guardian.id,
          userId: null,
          name: guardian.name,
          phone: guardian.phone,
          email: guardian.email,
          relation: guardian.relation,
          isPrimary: guardian.isPrimary,
          registered: false,
          online: false,
          latitude: null,
          longitude: null,
          accuracy: null,
          batteryLevel: null,
          networkStatus: "UNKNOWN",
          lastSeen: null,
          guardianMode: {
            active: false,
            status: null,
            startedAt: null,
          },
          safeJourney: {
            active: false,
            status: null,
            destination: null,
            estimatedArrival: null,
            startedAt: null,
          },
          emergency: {
            active: false,
            status: null,
            silentSOS: false,
            guardianMode: false,
            safeJourney: false,
            startedAt: null,
          },
        }));

  const connected = displayedGuardians.length;

  const onlineCount = displayedGuardians.filter(
    (guardian) => guardian.online
  ).length;

  const travellingCount = displayedGuardians.filter(
    (guardian) => guardian.safeJourney.active
  ).length;

  const emergencyCount = displayedGuardians.filter(
    (guardian) => guardian.emergency.active
  ).length;

  const safeCount = Math.max(
    0,
    connected - travellingCount - emergencyCount
  );

  return (
    <>
      <section className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
        <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
          CIRCLE STATUS
        </p>

        <h2 className="mt-3 text-3xl font-black">
          {connected} Guardian{connected === 1 ? "" : "s"} Connected
        </h2>

        <p className="mt-2 text-sm text-white/50">
          {onlineCount} currently online
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">
              {safeCount}
            </p>
            <p className="mt-1 text-xs text-white/50">Safe</p>
          </div>

          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-yellow-300">
              {travellingCount}
            </p>
            <p className="mt-1 text-xs text-white/50">
              Travelling
            </p>
          </div>

          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-red-400">
              {emergencyCount}
            </p>
            <p className="mt-1 text-xs text-white/50">
              Emergency
            </p>
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
              ? `📍 ${location.latitude.toFixed(
                  5
                )}, ${location.longitude.toFixed(5)}`
              : "📍 No location shared yet"}
          </p>

          <p className="mt-2 text-sm text-white/40">
            {mounted
              ? timeAgo(location?.updatedAt)
              : "Checking location status..."}
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
          <p className="mt-4 text-sm text-white/60">
            {statusText}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setStatusText("");
            setSharing((old) => !old);
          }}
          className={`mt-5 w-full rounded-full py-4 font-black ${
            sharing
              ? "bg-red-500 text-white"
              : "bg-emerald-500 text-black"
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
        guardians={displayedGuardians.map((guardian) => ({
          id: guardian.contactId,
          name: guardian.name,
          relation: guardian.relation,
          latitude: guardian.latitude,
          longitude: guardian.longitude,
          accuracy: guardian.accuracy,
          updatedAt: guardian.lastSeen,
        }))}
      />

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">
              Trusted Guardians
            </h2>

            <p className="mt-1 text-sm text-white/45">
              Live status refreshes every 10 seconds.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/guardian-invitations"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/65"
            >
              Invitations
            </Link>

            <Link
              href="/guardian-circle/add"
              className="rounded-full border border-emerald-500/30 px-4 py-2 text-xs font-black text-emerald-400"
            >
              Add
            </Link>
          </div>
        </div>

        {networkError && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {networkError}
          </div>
        )}

        <div className="mt-5 space-y-4">
          {networkLoading && displayedGuardians.length === 0 ? (
            <div className="animate-pulse rounded-[2rem] border border-white/10 bg-black/30 p-5">
              <div className="h-14 w-14 rounded-full bg-white/10" />
              <div className="mt-4 h-5 w-40 rounded bg-white/10" />
              <div className="mt-3 h-20 rounded-2xl bg-white/5" />
            </div>
          ) : displayedGuardians.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5 text-center">
              <p className="text-5xl">👥</p>

              <h3 className="mt-4 text-2xl font-black">
                No Guardians Yet
              </h3>

              <p className="mt-2 text-sm text-white/60">
                Invite trusted people who can receive your emergency
                alerts and location updates.
              </p>

              <Link
                href="/guardian-circle/add"
                className="mt-5 inline-block rounded-full bg-emerald-500 px-6 py-3 font-black text-black"
              >
                Invite Guardian
              </Link>
            </div>
          ) : (
            displayedGuardians.map((guardian) => (
              <div
                key={guardian.contactId}
                className={`rounded-[2rem] border p-5 ${
                  guardian.emergency.active
                    ? "border-red-500/40 bg-red-500/10"
                    : guardian.online
                      ? "border-emerald-500/20 bg-black/30"
                      : "border-white/10 bg-black/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
                    👤
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black">
                          {guardian.name}
                        </h3>

                        <p
                          className={`mt-1 text-sm font-bold ${
                            guardian.online
                              ? "text-emerald-400"
                              : "text-white/45"
                          }`}
                        >
                          {guardian.online
                            ? "🟢 Online"
                            : "⚪ Offline"}
                        </p>
                      </div>

                      {guardian.isPrimary && (
                        <span className="shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-[#111] p-3">
                        <p className="text-white/40">Battery</p>
                        <p className="mt-1 font-bold">
                          {batteryIcon(guardian.batteryLevel)}{" "}
                          {batteryLabel(guardian.batteryLevel)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#111] p-3">
                        <p className="text-white/40">Network</p>
                        <p className="mt-1 truncate font-bold">
                          📶 {guardian.networkStatus}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#111] p-3">
                        <p className="text-white/40">Relation</p>
                        <p className="mt-1 truncate font-bold">
                          {guardian.relation || "Trusted"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#111] p-3">
                        <p className="text-white/40">Last seen</p>
                        <p className="mt-1 truncate font-bold">
                          {timeAgo(guardian.lastSeen)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {guardian.guardianMode.active && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300">
                          🛡️ Guardian Mode Active
                        </span>
                      )}

                      {guardian.safeJourney.active && (
                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs font-black text-yellow-300">
                          🚗 Safe Journey
                        </span>
                      )}

                      {guardian.emergency.active && (
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300">
                          🚨 Emergency Active
                        </span>
                      )}

                      {!guardian.registered && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/45">
                          Awaiting MyOgun registration
                        </span>
                      )}
                    </div>

                    {guardian.safeJourney.destination && (
                      <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                        <p className="text-sm font-bold text-yellow-200">
                          Travelling to{" "}
                          {guardian.safeJourney.destination}
                        </p>

                        {guardian.safeJourney.estimatedArrival && (
                          <p className="mt-1 text-xs text-yellow-100/60">
                            ETA:{" "}
                            {new Date(
                              guardian.safeJourney.estimatedArrival
                            ).toLocaleString("en-GB")}
                          </p>
                        )}
                      </div>
                    )}

                    {guardian.latitude !== null &&
                    guardian.longitude !== null ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-[#111] p-3">
                        <p className="text-sm text-white/55">
                          📍 {guardian.latitude.toFixed(5)},{" "}
                          {guardian.longitude.toFixed(5)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-[#111] p-3">
                        <p className="text-sm text-white/50">
                          📍 Live location is not currently available.
                        </p>
                      </div>
                    )}
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