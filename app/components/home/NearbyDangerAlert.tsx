"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistance } from "@/lib/location/distance";

type NearbyIncident = {
  id: string;
  title: string;
  type: string;
  status: string;
  confidenceScore: number;
  area?: string | null;
  localGovernment?: string | null;
  distance: number;
};

type DangerLevel = "safe" | "caution" | "danger" | "critical";

function getDangerLevel(distance: number): DangerLevel {
  if (distance > 5000) return "safe";
  if (distance > 1000) return "caution";
  if (distance > 500) return "danger";
  return "critical";
}

function getCardStyle(level: DangerLevel) {
  const styles = {
    safe: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      button: "bg-emerald-500 text-black",
    },
    caution: {
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/10",
      text: "text-yellow-300",
      button: "bg-yellow-400 text-black",
    },
    danger: {
      border: "border-orange-500/30",
      bg: "bg-orange-500/10",
      text: "text-orange-300",
      button: "bg-orange-500 text-white",
    },
    critical: {
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-300",
      button: "bg-red-500 text-white",
    },
  };

  return styles[level];
}

function getDangerTitle(level: DangerLevel) {
  if (level === "safe") return "YOU'RE SAFE";
  if (level === "caution") return "CAUTION NEARBY";
  if (level === "danger") return "NEARBY DANGER";
  return "DANGER VERY CLOSE";
}

function getDangerMessage(level: DangerLevel, distance: number) {
  if (level === "safe") return "No reported danger within 5km.";
  if (level === "caution") return `Verified incident ${formatDistance(distance)} away`;
  if (level === "danger") return `Danger reported ${formatDistance(distance)} away`;
  return `Immediate danger ${formatDistance(distance)} away`;
}

function getVibrationPattern(level: DangerLevel) {
  if (level === "critical") return [700, 200, 700, 200, 700];
  if (level === "danger") return [300, 150, 300];
  return null;
}

type Props = {
  onDangerChange?: (incident: NearbyIncident | null) => void;
};

export default function NearbyDangerAlert({
  onDangerChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [closest, setClosest] = useState<NearbyIncident | null>(null);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      setError("GPS unavailable");
      return;
    }

    const checkNearbyDanger = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const res = await fetch(
              `/api/nearby-danger?lat=${lat}&lng=${lng}&radius=5000`
            );

            const data = await res.json();

            if (data.closest) {
            const incident = data.closest as NearbyIncident;

            setClosest(incident);
            onDangerChange?.(incident);

              const level = getDangerLevel(incident.distance);
              const vibrationPattern = getVibrationPattern(level);

              const vibrationKey = `myogun-danger-${incident.id}-${level}`;
              const alreadyAlerted = sessionStorage.getItem(vibrationKey);

              if (
                vibrationPattern &&
                !alreadyAlerted &&
                "vibrate" in navigator
              ) {
                navigator.vibrate(vibrationPattern);
                sessionStorage.setItem(vibrationKey, "true");
              }
            } else {
              setClosest(null);
              onDangerChange?.(null);
            }

            setLastChecked(new Date());
            setLoading(false);
          } catch (err) {
            console.error(err);
            setLoading(false);
            setError("Unable to check nearby danger");
          }
        },
        () => {
          setLoading(false);
          setError("Location permission needed");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 15000,
        }
      );
    };

    checkNearbyDanger();

    const timer = setInterval(checkNearbyDanger, 30000);

    return () => clearInterval(timer);
     }, [onDangerChange]);

  if (loading) {
    return (
      <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111] p-5 text-white/50">
        Checking nearby danger...
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-5 rounded-[2rem] border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-300">
        ⚠ {error}
      </section>
    );
  }

if (!closest) {
  return (
    <section className="mt-5 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
      <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
        LOCATION CHECKED
      </p>

      <h2 className="mt-3 text-2xl font-black">
        No nearby danger found
      </h2>

      <p className="mt-2 text-sm text-white/60">
        MyOgun checked incidents within 5km of your current location.
      </p>

      {lastChecked && (
        <p className="mt-4 text-xs text-white/40">
          Last checked {lastChecked.toLocaleTimeString()}
        </p>
      )}
    </section>
  );
}

  const level = getDangerLevel(closest.distance);
  const style = getCardStyle(level);

  return (
    <section className={`mt-5 rounded-[2rem] border p-5 ${style.border} ${style.bg}`}>
      <p className={`text-sm font-black tracking-[0.25em] ${style.text}`}>
        {getDangerTitle(level)}
      </p>

      <h2 className="mt-3 text-3xl font-black">
        {getDangerMessage(level, closest.distance)}
      </h2>

      <p className="mt-3 text-lg text-white/70">{closest.title}</p>

      <p className="text-sm text-white/50">
        📍 {closest.area || closest.localGovernment || "Location pending"}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="rounded-full bg-black/30 px-4 py-2 text-xs font-black text-white">
          {closest.status}
        </span>

        <span className="rounded-full bg-black/30 px-4 py-2 text-xs font-black text-white">
          {formatDistance(closest.distance)}
        </span>

        <span className={`rounded-full px-4 py-2 text-xs font-black ${style.button}`}>
          {level === "critical"
            ? "TAKE ACTION NOW"
            : level === "danger"
            ? "BE CAREFUL"
            : "STAY ALERT"}
        </span>
      </div>

      {lastChecked && (
        <p className="mt-4 text-xs text-white/40">
          Monitoring live • Updates every 30 seconds • Last checked{" "}
          {lastChecked.toLocaleTimeString()}
        </p>
      )}

      <Link
        href={`/incidents/${closest.id}`}
        className={`mt-5 block rounded-full py-4 text-center font-black ${style.button}`}
      >
        View Incident
      </Link>
    </section>
  );
}