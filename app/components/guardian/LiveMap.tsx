"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { useEffect } from "react";

type LiveLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  createdAt: string;
} | null;

type LiveMapProps = {
  location: LiveLocation;
};

const userMarkerIcon = L.divIcon({
  className: "",
  html: `
    <div
      style="
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        background: #dc2626;
        border: 4px solid white;
        box-shadow: 0 0 0 8px rgba(220, 38, 38, 0.25);
      "
    ></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function RecenterMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), {
      animate: true,
    });
  }, [latitude, longitude, map]);

  return null;
}

function formatUpdatedTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

export default function LiveMap({
  location,
}: LiveMapProps) {
  if (!location) {
    return (
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">
            Live Location
          </h2>

          <p className="mt-1 text-sm text-white/50">
            Waiting for GPS information.
          </p>
        </div>

        <div className="flex min-h-[380px] items-center justify-center px-6 text-center">
          <div>
            <div className="text-5xl">📍</div>

            <p className="mt-4 font-semibold text-white">
              Location unavailable
            </p>

            <p className="mt-2 max-w-sm text-sm text-white/50">
              The user&apos;s latest location will appear
              here when Guardian Mode receives a GPS
              update.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const position: [number, number] = [
    location.latitude,
    location.longitude,
  ];

  const googleMapsUrl =
    "https://www.google.com/maps?q=" +
    location.latitude +
    "," +
    location.longitude;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            Live Location
          </h2>

          <p className="mt-1 text-sm text-white/50">
            Updated automatically as new GPS data arrives.
          </p>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500"
        >
          Open in Google Maps
        </a>
      </div>

      <div className="relative h-[380px] w-full">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={position}
            icon={userMarkerIcon}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-bold">
                  Guardian Mode location
                </p>

                <p>
                  Latitude:{" "}
                  {location.latitude.toFixed(6)}
                </p>

                <p>
                  Longitude:{" "}
                  {location.longitude.toFixed(6)}
                </p>

                {location.accuracy !== null &&
                location.accuracy !== undefined ? (
                  <p>
                    Accuracy:{" "}
                    {Math.round(location.accuracy)} m
                  </p>
                ) : null}
              </div>
            </Popup>
          </Marker>

          <RecenterMap
            latitude={location.latitude}
            longitude={location.longitude}
          />
        </MapContainer>
      </div>

      <div className="grid gap-4 border-t border-white/10 px-5 py-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-white/40">
            Latitude
          </p>

          <p className="mt-1 font-semibold text-white">
            {location.latitude.toFixed(6)}
          </p>
        </div>

        <div>
          <p className="text-white/40">
            Longitude
          </p>

          <p className="mt-1 font-semibold text-white">
            {location.longitude.toFixed(6)}
          </p>
        </div>

        <div>
          <p className="text-white/40">
            Last updated
          </p>

          <p className="mt-1 font-semibold text-white">
            {formatUpdatedTime(location.createdAt)}
          </p>
        </div>
      </div>
    </section>
  );
}