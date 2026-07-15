"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import GuardianStatusCard, {
  type GuardianNetworkItem,
} from "@/app/components/guardian/GuardianStatusCard";

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

type GuardianNetworkSummary = {
  total: number;
  online: number;
  recent: number;
  offline: number;
  travelling: number;
  emergencies: number;
};

type GuardianNetworkResponse = {
  success: boolean;
  guardians: GuardianNetworkItem[];
  summary: GuardianNetworkSummary;
  checkedAt?: string;
  error?: string;
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

function locationStatus(
  updatedAt?: string | Date | null
): "ONLINE" | "RECENT" | "OFFLINE" {
  if (!updatedAt) return "OFFLINE";

  const minutes = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / 60000
  );

  if (minutes <= 2) return "ONLINE";
  if (minutes <= 15) return "RECENT";

  return "OFFLINE";
}

const emptySummary: GuardianNetworkSummary = {
  total: 0,
  online: 0,
  recent: 0,
  offline: 0,
  travelling: 0,
  emergencies: 0,
};

export default function GuardianCircleClient({
  guardians,
  myLocation,
}: Props) {
  const [location, setLocation] = useState(myLocation);
  const [sharing, setSharing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mounted, setMounted] = useState(false);

  const [networkGuardians, setNetworkGuardians] = useState<
    GuardianNetworkItem[]
  >([]);

  const [networkSummary, setNetworkSummary] =
    useState<GuardianNetworkSummary>(emptySummary);

  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState("");
  const [refreshingNetwork, setRefreshingNetwork] = useState(false);

  const lastUploadRef = useRef<number>(0);

  const status = mounted
    ? locationStatus(location?.updatedAt)
    : "OFFLINE";

  const connected = networkSummary.total || guardians.length;

  const safeCount =
    connected -
    networkSummary.emergencies -
    networkSummary.travelling;

  const loadGuardianNetwork = useCallback(
    async (manualRefresh = false) => {
      try {
        if (manualRefresh) {
          setRefreshingNetwork(true);
        }

        setNetworkError("");

        const response = await fetch("/api/guardian-network", {
          method: "GET",
          cache: "no-store",
        });

        const data =
          (await response.json()) as GuardianNetworkResponse;

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load Guardian Network."
          );
        }

        setNetworkGuardians(data.guardians ?? []);
        setNetworkSummary(data.summary ?? emptySummary);
      } catch (error) {
        console.error("Guardian Network load error:", error);

        setNetworkError(
          error instanceof Error
            ? error.message
            : "Unable to load Guardian Network."
        );
      } finally {
        setNetworkLoading(false);
        setRefreshingNetwork(false);
      }
    },
    []
  );

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

    const interval = window.setInterval(() => {
      void loadGuardianNetwork();
    }, 10000);

    return () => {
      window.clearInterval(interval);
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
          let batteryLevel: number | null = null;

          type BatteryManager = {
            level: number;
          };

          type NavigatorWithBattery = Navigator & {
            getBattery?: () => Promise<BatteryManager>;
            connection?: {
              effectiveType?: string;
              type?: string;
            };
          };

          const extendedNavigator =
            navigator as NavigatorWithBattery;

          if (extendedNavigator.getBattery) {
            try {
              const battery =
                await extendedNavigator.getBattery();

              batteryLevel = Math.round(
                battery.level * 100
              );
            } catch {
              batteryLevel = null;
            }
          }

          const networkStatus =
            extendedNavigator.connection?.effectiveType ||
            extendedNavigator.connection?.type ||
            (navigator.onLine ? "ONLINE" : "OFFLINE");

          const response = await fetch("/api/location/share", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              batteryLevel,
              networkStatus,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            setStatusText(
              data.error || "Unable to share location."
            );
            return;
          }

          setLocation(data.location);
          setStatusText("Live location updated.");

          void loadGuardianNetwork();
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
  }, [sharing, loadGuardianNetwork]);

  return (
    <>
      <section className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
              GUARDIAN NETWORK
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {connected} Guardian
              {connected === 1 ? "" : "s"} Connected
            </h2>
          </div>

          <Link
            href="/guardian-invitations"
            className="shrink-0 rounded-full border border-emerald-500/30 bg-black/20 px-4 py-2 text-xs font-black text-emerald-300"
          >
            Invitations
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">
              {Math.max(0, safeCount)}
            </p>

            <p className="mt-1 text-xs text-white/50">
              Safe
            </p>
          </div>

          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-yellow-300">
              {networkSummary.travelling}
            </p>

            <p className="mt-1 text-xs text-white/50">
              Travelling
            </p>
          </div>

          <div className="rounded-2xl bg-black/30 p-4 text-center">
            <p className="text-2xl font-black text-red-400">
              {networkSummary.emergencies}
            </p>

            <p className="mt-1 text-xs text-white/50">
              Emergency
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-xl bg-black/20 px-3 py-2 text-emerald-300">
            {networkSummary.online} Online
          </div>

          <div className="rounded-xl bg-black/20 px-3 py-2 text-yellow-200">
            {networkSummary.recent} Recent
          </div>

          <div className="rounded-xl bg-black/20 px-3 py-2 text-white/50">
            {networkSummary.offline} Offline
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
            setSharing((current) => !current);
          }}
          className={`mt-5 w-full rounded-full py-4 font-black ${
            sharing
              ? "bg-red-500 text-white"
              : "bg-emerald-500 text-black"
          }`}
        >
          {sharing
            ? "Stop Sharing"
            : "Start Live Sharing"}
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
  guardians={networkGuardians.map((guardian) => ({
    id: guardian.id,
    name: guardian.name,
    relation: guardian.relation,
    presence: guardian.presence,
    lastSeen: guardian.lastSeen,
    sharingLocation: guardian.sharingLocation,
    latitude: guardian.latitude,
    longitude: guardian.longitude,
    accuracy: guardian.accuracy,
    batteryLevel: guardian.batteryLevel,
    networkStatus: guardian.networkStatus,
    onJourney: guardian.onJourney,
    inEmergency: guardian.inEmergency,
  }))}
/>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">
              Trusted Guardians
            </h2>

            <p className="mt-1 text-sm text-white/45">
              Live network status refreshes every 10 seconds.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={refreshingNetwork}
              onClick={() =>
                void loadGuardianNetwork(true)
              }
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshingNetwork
                ? "Refreshing..."
                : "Refresh"}
            </button>

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
          {networkLoading ? (
            <>
              <GuardianLoadingCard />
              <GuardianLoadingCard />
            </>
          ) : networkGuardians.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5 text-center">
              <p className="text-5xl">👥</p>

              <h3 className="mt-4 text-2xl font-black">
                No Guardians Yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Invite trusted people who can receive your
                emergency alerts, journeys and live location.
              </p>

              <Link
                href="/guardian-circle/add"
                className="mt-5 inline-block rounded-full bg-emerald-500 px-6 py-3 font-black text-black"
              >
                Invite Guardian
              </Link>
            </div>
          ) : (
            networkGuardians.map((guardian) => (
              <GuardianStatusCard
                key={guardian.id}
                guardian={guardian}
              />
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
          <p className="mt-3 font-black">
            Guardian Mode
          </p>
        </Link>

        <Link
          href="/silent-sos"
          className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5 text-center transition active:scale-95"
        >
          <p className="text-4xl">🚨</p>
          <p className="mt-3 font-black">
            Silent SOS
          </p>
        </Link>
      </section>
    </>
  );
}

function GuardianLoadingCard() {
  return (
    <div className="animate-pulse rounded-[2rem] border border-white/10 bg-black/30 p-5">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-full bg-white/10" />

        <div className="flex-1">
          <div className="h-5 w-36 rounded bg-white/10" />
          <div className="mt-3 h-4 w-24 rounded bg-white/10" />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-16 rounded-2xl bg-white/5" />
            <div className="h-16 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}