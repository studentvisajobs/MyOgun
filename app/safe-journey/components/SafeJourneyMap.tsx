"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, {
  type LatLngBoundsExpression,
} from "leaflet";
import "leaflet/dist/leaflet.css";

export type JourneyRoutePoint = {
  id?: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed?: number | null;
  heading?: number | null;
  createdAt: string;
};

type Props = {
  routePoints: JourneyRoutePoint[];
  destination: string;
  active: boolean;
};

const currentLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      height:38px;
      width:38px;
      border-radius:999px;
      background:#10b981;
      border:3px solid white;
      box-shadow:0 4px 18px rgba(0,0,0,0.45);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:18px;
    ">
      🚶
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
});

const startLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      height:32px;
      width:32px;
      border-radius:999px;
      background:#2563eb;
      border:3px solid white;
      box-shadow:0 4px 14px rgba(0,0,0,0.4);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:14px;
    ">
      🟢
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -17],
});

function formatLastUpdate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - date.getTime()) / 1000
    )
  );

  if (seconds < 10) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function AutoFitJourney({
  routePoints,
}: {
  routePoints: JourneyRoutePoint[];
}) {
  const map = useMap();

  useEffect(() => {
    if (routePoints.length === 0) {
      return;
    }

    const points: [number, number][] =
      routePoints.map((point) => [
        point.latitude,
        point.longitude,
      ]);

    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }

    const bounds: LatLngBoundsExpression =
      points;

    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 16,
    });
  }, [map, routePoints]);

  return null;
}

export default function SafeJourneyMap({
  routePoints,
  destination,
  active,
}: Props) {
  if (routePoints.length === 0) {
    return (
      <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">
              Live Journey Map
            </h2>

            <p className="mt-1 text-sm text-white/45">
              Your route will appear here when
              journey tracking starts.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/45">
            No route
          </span>
        </div>

        <div className="mt-5 flex h-72 items-center justify-center rounded-[2rem] border border-white/10 bg-black/40 text-center">
          <div className="max-w-sm px-6">
            <p className="text-5xl">🗺️</p>

            <p className="mt-4 font-black">
              Journey route unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Start a Safe Journey and allow
              location access to begin recording
              your route.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const firstPoint = routePoints[0];
  const currentPoint =
    routePoints[routePoints.length - 1];

  const routeCoordinates: [number, number][] =
    routePoints.map((point) => [
      point.latitude,
      point.longitude,
    ]);

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">
            Live Journey Map
          </h2>

          <p className="mt-1 text-sm text-white/45">
            {destination
              ? `Travelling to ${destination}`
              : "Your recorded Safe Journey route"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-2 text-xs font-black ${
            active
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border border-white/10 bg-white/5 text-white/50"
          }`}
        >
          {active ? "LIVE" : "ENDED"}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-[2rem] border border-white/10">
        <MapContainer
          center={[
            currentPoint.latitude,
            currentPoint.longitude,
          ]}
          zoom={16}
          scrollWheelZoom={false}
          className="h-96 w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoFitJourney
            routePoints={routePoints}
          />

          {routeCoordinates.length > 1 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: "#2563eb",
                weight: 6,
                opacity: 0.85,
              }}
            />
          )}

          <Marker
            position={[
              firstPoint.latitude,
              firstPoint.longitude,
            ]}
            icon={startLocationIcon}
          >
            <Popup>
              <div className="min-w-40">
                <p className="font-bold">
                  Journey started
                </p>

                <p className="mt-1 text-sm">
                  {new Date(
                    firstPoint.createdAt
                  ).toLocaleString("en-GB")}
                </p>
              </div>
            </Popup>
          </Marker>

          <Marker
            position={[
              currentPoint.latitude,
              currentPoint.longitude,
            ]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div className="min-w-48">
                <p className="font-bold">
                  Current location
                </p>

                <p className="mt-1 text-sm">
                  Updated{" "}
                  {formatLastUpdate(
                    currentPoint.createdAt
                  )}
                </p>

                {currentPoint.accuracy !== null && (
                  <p className="mt-1 text-xs">
                    Accuracy:{" "}
                    {Math.round(
                      currentPoint.accuracy
                    )}
                    m
                  </p>
                )}

                {currentPoint.speed !== null &&
                  currentPoint.speed !==
                    undefined && (
                    <p className="mt-1 text-xs">
                      Speed:{" "}
                      {Math.max(
                        0,
                        currentPoint.speed * 3.6
                      ).toFixed(1)}{" "}
                      km/h
                    </p>
                  )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-black/30 p-4">
          <p className="text-2xl font-black text-blue-400">
            {routePoints.length}
          </p>

          <p className="mt-1 text-xs text-white/45">
            Route points
          </p>
        </div>

        <div className="rounded-2xl bg-black/30 p-4">
          <p className="text-2xl font-black text-emerald-400">
            {formatLastUpdate(
              currentPoint.createdAt
            )}
          </p>

          <p className="mt-1 text-xs text-white/45">
            Last update
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-blue-300">
          🔵 Route travelled
        </span>

        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
          🟢 Current position
        </span>
      </div>
    </section>
  );
}