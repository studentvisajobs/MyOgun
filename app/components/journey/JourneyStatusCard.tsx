"use client";

import { useEffect, useState } from "react";

type Journey = {
  id: string;
  destination: string;
  estimatedArrival: string | null;
  startedAt: string;
  status: string;
};

type Props = {
  journey: Journey;
};

function formatTime(value: string | null) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function minutesSince(startedAt: string) {
  const startedTime = new Date(startedAt).getTime();

  if (Number.isNaN(startedTime)) {
    return null;
  }

  return Math.max(
    0,
    Math.floor((Date.now() - startedTime) / 60000)
  );
}

function getStatusLabel(status: string) {
  if (status === "ACTIVE") return "On Journey";
  if (status === "CHECKED_IN") return "Checked In";
  if (status === "OVERDUE") return "Journey Overdue";
  if (status === "COMPLETED") return "Arrived Safely";
  if (status === "CANCELLED") return "Journey Cancelled";

  return status.replaceAll("_", " ");
}

function getStatusStyle(status: string) {
  if (status === "ACTIVE") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "CHECKED_IN") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
  }

  if (status === "OVERDUE") {
    return "border-red-500/40 bg-red-500/15 text-red-200";
  }

  if (status === "COMPLETED") {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  }

  return "border-white/10 bg-white/5 text-white/55";
}

export default function JourneyStatusCard({
  journey,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const duration = mounted
    ? minutesSince(journey.startedAt)
    : null;

  return (
    <div
      className={`mt-4 rounded-2xl border p-4 ${getStatusStyle(
        journey.status
      )}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em]">
            Safe Journey
          </p>

          <h3 className="mt-3 text-lg font-black text-white">
            {journey.destination}
          </h3>
        </div>

        <span className="text-2xl">
          {journey.status === "OVERDUE" ? "⚠️" : "🚗"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/25 p-3">
          <p className="text-xs text-white/45">Started</p>

          <p className="mt-1 font-bold text-white/80">
            {!mounted
              ? "Checking..."
              : duration === null
                ? "Unknown"
                : duration < 1
                  ? "Just now"
                  : `${duration} min ago`}
          </p>
        </div>

        <div className="rounded-xl bg-black/25 p-3">
          <p className="text-xs text-white/45">ETA</p>

          <p className="mt-1 font-bold text-white/80">
            {formatTime(journey.estimatedArrival)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-black/25 p-3">
        <p className="text-xs text-white/45">Journey status</p>

        <p className="mt-1 font-black">
          {getStatusLabel(journey.status)}
        </p>
      </div>

      {journey.status === "OVERDUE" && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm font-bold text-red-200">
            This journey has passed its expected arrival time.
          </p>
        </div>
      )}
    </div>
  );
}