"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import JourneyStatusCard from "@/app/components/journey/JourneyStatusCard";

type Presence = "ONLINE" | "RECENT" | "OFFLINE";

type Journey = {
  id: string;
  destination: string;
  estimatedArrival: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  startedAt: string;
} | null;

type Emergency = {
  id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  startedAt: string;
  guardianMode: boolean;
  silentSOS: boolean;
  safeJourney: boolean;
} | null;

export type GuardianNetworkItem = {
  id: string;
  userId: string | null;

  name: string;
  phone: string;
  email: string | null;
  relation: string | null;
  isPrimary: boolean;

  registered: boolean;

  online: boolean;
  presence: Presence;
  lastSeen: string | null;
  sharingLocation: boolean;

  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;

  batteryLevel: number | null;
  networkStatus: string;

  onJourney: boolean;
  journey: Journey;

  inEmergency: boolean;
  emergency: Emergency;
};

type Props = {
  guardian: GuardianNetworkItem;
};

function getPresenceLabel(presence: Presence) {
  if (presence === "ONLINE") return "Online";
  if (presence === "RECENT") return "Recently active";
  return "Offline";
}

function getPresenceStyle(presence: Presence) {
  if (presence === "ONLINE") {
    return {
      dot: "bg-emerald-400",
      badge:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (presence === "RECENT") {
    return {
      dot: "bg-yellow-300",
      badge:
        "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
    };
  }

  return {
    dot: "bg-white/30",
    badge: "border-white/10 bg-white/5 text-white/50",
  };
}

function formatBattery(level: number | null) {
  if (level === null) return "Unknown";
  return `${level}%`;
}

function getBatteryStyle(level: number | null) {
  if (level === null) return "text-white/45";
  if (level <= 20) return "text-red-300";
  if (level <= 40) return "text-yellow-300";
  return "text-emerald-300";
}

function getNetworkLabel(status: string) {
  if (!status || status === "UNKNOWN") {
    return "Unknown";
  }

  return status;
}

function formatCoordinates(
  latitude: number | null,
  longitude: number | null
) {
  if (latitude === null || longitude === null) {
    return "Location unavailable";
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function timeAgo(value: string | null) {
  if (!value) return "Never seen";

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  );

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

export default function GuardianStatusCard({
  guardian,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const presenceStyle = getPresenceStyle(guardian.presence);

  if (!guardian.registered) {
    return (
      <article className="rounded-[2rem] border border-white/10 bg-black/30 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/5 text-3xl">
            👤
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-black">
                  {guardian.name}
                </h3>

                <p className="mt-1 text-sm text-white/45">
                  {guardian.relation || "Trusted Guardian"}
                </p>
              </div>

              {guardian.isPrimary && (
                <span className="shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
                  Primary
                </span>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#111] p-4">
              <div className="flex items-center gap-2 text-sm text-white/55">
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                Not registered on MyOgun
              </div>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Live status, location, journey and emergency updates
                will appear after this guardian joins MyOgun with the
                same phone number.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-[#111] p-3">
                <p className="text-white/35">Phone</p>

                <p className="mt-1 truncate font-bold text-white/75">
                  {guardian.phone}
                </p>
              </div>

              <div className="rounded-2xl bg-[#111] p-3">
                <p className="text-white/35">Status</p>

                <p className="mt-1 font-bold text-white/55">
                  Invitation required
                </p>
              </div>
            </div>

            <Link
              href="/guardian-circle/add"
              className="mt-4 block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center font-black text-emerald-300 transition hover:bg-emerald-500 hover:text-black"
            >
              Send Guardian Invitation
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`rounded-[2rem] border p-5 ${
        guardian.inEmergency
          ? "border-red-500/40 bg-red-500/10"
          : guardian.onJourney
            ? "border-yellow-500/30 bg-yellow-500/5"
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

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${presenceStyle.badge}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${presenceStyle.dot}`}
                  />

                  {getPresenceLabel(guardian.presence)}
                </span>

                {guardian.isPrimary && (
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">
                    Primary
                  </span>
                )}

                {guardian.onJourney && (
                  <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-200">
                    Travelling
                  </span>
                )}

                {guardian.inEmergency && (
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                    Emergency
                  </span>
                )}
              </div>
            </div>

            <span className="shrink-0 text-2xl">
              {guardian.inEmergency
                ? "🚨"
                : guardian.onJourney
                  ? "🚗"
                  : guardian.online
                    ? "🟢"
                    : "⚪"}
            </span>
          </div>

          <p className="mt-3 text-sm text-white/45">
            {guardian.relation || "Trusted Guardian"}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[#111] p-3">
              <p className="text-white/35">Battery</p>

              <p
                className={`mt-1 font-black ${getBatteryStyle(
                  guardian.batteryLevel
                )}`}
              >
                🔋 {formatBattery(guardian.batteryLevel)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#111] p-3">
              <p className="text-white/35">Network</p>

              <p className="mt-1 font-black text-white/75">
                📶 {getNetworkLabel(guardian.networkStatus)}
              </p>
            </div>

            <div className="rounded-2xl bg-[#111] p-3">
              <p className="text-white/35">Last seen</p>

              <p className="mt-1 font-black text-white/75">
                🕒{" "}
                {mounted
                  ? timeAgo(guardian.lastSeen)
                  : "Checking..."}
              </p>
            </div>

            <div className="rounded-2xl bg-[#111] p-3">
              <p className="text-white/35">Location sharing</p>

              <p
                className={`mt-1 font-black ${
                  guardian.sharingLocation
                    ? "text-emerald-300"
                    : "text-white/45"
                }`}
              >
                📍{" "}
                {guardian.sharingLocation
                  ? "Active"
                  : "Not sharing"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#111] p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
              Last known location
            </p>

            <p className="mt-2 break-words text-sm font-bold text-white/70">
              {formatCoordinates(
                guardian.latitude,
                guardian.longitude
              )}
            </p>

            {guardian.accuracy !== null && (
              <p className="mt-2 text-xs text-white/35">
                Accuracy approximately{" "}
                {Math.round(guardian.accuracy)}m
              </p>
            )}
          </div>

          {guardian.journey && (
            <JourneyStatusCard journey={guardian.journey} />
          )}

          {guardian.emergency && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                Emergency Active
              </p>

              <p className="mt-2 font-black text-red-100">
                Status: {guardian.emergency.status}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {guardian.emergency.silentSOS && (
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                    Silent SOS
                  </span>
                )}

                {guardian.emergency.guardianMode && (
                  <span className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-black text-red-200">
                    Guardian Mode
                  </span>
                )}

                {guardian.emergency.safeJourney && (
                  <span className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-black text-red-200">
                    Safe Journey
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {guardian.sharingLocation &&
            guardian.latitude !== null &&
            guardian.longitude !== null ? (
              <Link
                href={`/guardian-circle?guardian=${guardian.id}`}
                className="rounded-full bg-emerald-500 px-4 py-3 text-center text-sm font-black text-black transition hover:bg-emerald-400"
              >
                View Location
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-white/5 px-4 py-3 text-sm font-black text-white/30"
              >
                Location Unavailable
              </button>
            )}

            <a
              href={`tel:${guardian.phone}`}
              className={`rounded-full border px-4 py-3 text-center text-sm font-black transition ${
                guardian.inEmergency
                  ? "border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500 hover:text-white"
                  : "border-white/10 text-white/70 hover:bg-white/5"
              }`}
            >
              Call Guardian
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}