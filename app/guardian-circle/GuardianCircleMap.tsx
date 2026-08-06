"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type Location = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
};

export type MapGuardian = {
  id: string;
  name: string;
  relation: string | null;
  presence: "ONLINE" | "RECENT" | "OFFLINE";
  lastSeen: string | null;
  sharingLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  batteryLevel: number | null;
  networkStatus: string;
  onJourney: boolean;
  inEmergency: boolean;
};

type Props = {
  myLocation: Location | null;
  guardians: MapGuardian[];
};

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      height:36px;
      width:36px;
      border-radius:999px;
      background:#10b981;
      border:3px solid white;
      box-shadow:0 4px 16px rgba(0,0,0,0.45);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:17px;
    ">
      📍
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

function createGuardianIcon(
  presence: MapGuardian["presence"],
  inEmergency: boolean,
  onJourney: boolean
) {
  let borderColour = "#6b7280";
  let backgroundColour = "#111827";
  let symbol = "👤";

  if (presence === "ONLINE") {
    borderColour = "#10b981";
  } else if (presence === "RECENT") {
    borderColour = "#facc15";
  }

  if (onJourney) {
    backgroundColour = "#422006";
    borderColour = "#facc15";
    symbol = "🚗";
  }

  if (inEmergency) {
    backgroundColour = "#7f1d1d";
    borderColour = "#ef4444";
    symbol = "🚨";
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="
        height:36px;
        width:36px;
        border-radius:999px;
        background:${backgroundColour};
        border:3px solid ${borderColour};
        box-shadow:0 4px 16px rgba(0,0,0,0.45);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:17px;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

function formatLastSeen(value: string | null) {
  if (!value) return "Never seen";

  const milliseconds = Date.now() - new Date(value).getTime();
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function getPresenceLabel(presence: MapGuardian["presence"]) {
  if (presence === "ONLINE") return "Online";
  if (presence === "RECENT") return "Recently active";
  return "Offline";
}

function AutoFitMap({
  myLocation,
  guardians,
}: {
  myLocation: Location | null;
  guardians: MapGuardian[];
}) {
  const map = useMap();

  useEffect(() => {
    const emergencyGuardian = guardians.find(
      (guardian) =>
        guardian.inEmergency &&
        guardian.latitude !== null &&
        guardian.longitude !== null
    );

    if (emergencyGuardian) {
      map.setView(
        [
          emergencyGuardian.latitude as number,
          emergencyGuardian.longitude as number,
        ],
        17
      );

      return;
    }

    const onlineGuardian = guardians.find(
      (guardian) =>
        guardian.presence === "ONLINE" &&
        guardian.latitude !== null &&
        guardian.longitude !== null
    );

    if (onlineGuardian) {
      map.setView(
        [
          onlineGuardian.latitude as number,
          onlineGuardian.longitude as number,
        ],
        16
      );

      return;
    }

    if (myLocation) {
      map.setView(
        [myLocation.latitude, myLocation.longitude],
        15
      );

      return;
    }

    if (
      guardians.length > 0 &&
      guardians[0].latitude !== null &&
      guardians[0].longitude !== null
    ) {
      map.setView(
        [
          guardians[0].latitude as number,
          guardians[0].longitude as number,
        ],
        15
      );
    }
  }, [map, myLocation, guardians]);

  return null;
}
export default function GuardianCircleMap({
  myLocation,
  guardians,
}: Props) {
  const visibleGuardians = guardians.filter(
  (guardian) =>
    guardian.sharingLocation &&
    guardian.latitude !== null &&
    guardian.longitude !== null
);

  const hasMapLocation =
    Boolean(myLocation) || visibleGuardians.length > 0;

  if (!hasMapLocation) {
    return (
      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">
              Live Guardian Map
            </h2>

            <p className="mt-1 text-sm text-white/45">
              View guardians who are actively sharing their location.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-white/45">
            0 visible
          </span>
        </div>

        <div className="mt-4 flex h-64 items-center justify-center rounded-[2rem] border border-white/10 bg-black/40 text-center">
          <div className="max-w-sm px-6">
            <p className="text-5xl">📍</p>

            <p className="mt-4 font-black">
              No live locations available
            </p>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Start sharing your location or wait for a registered
              guardian to share theirs.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const initialPosition: [number, number] = myLocation
    ? [myLocation.latitude, myLocation.longitude]
    : [
        visibleGuardians[0].latitude as number,
        visibleGuardians[0].longitude as number,
      ];

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">
            Live Guardian Map
          </h2>

          <p className="mt-1 text-sm text-white/45">
            Locations update automatically with the Guardian Network.
          </p>
        </div>

        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
          {visibleGuardians.length} guardian
          {visibleGuardians.length === 1 ? "" : "s"} visible
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[2rem] border border-white/10">
        <MapContainer
          center={initialPosition}
          zoom={15}
          scrollWheelZoom={false}
          className="h-80 w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoFitMap
            myLocation={myLocation}
            guardians={visibleGuardians}
          />

          {myLocation && (
            <Marker
              position={[
                myLocation.latitude,
                myLocation.longitude,
              ]}
              icon={userIcon}
            >
              <Popup>
                <div className="min-w-40">
                  <p className="font-bold">You</p>
                  <p className="mt-1 text-sm">
                      Your live location
                    </p>

                    <p className="mt-2 text-xs">
                      Last updated: {formatLastSeen(myLocation.updatedAt)}
                    </p>

                  {myLocation.accuracy !== null && (
                    <p className="mt-1 text-xs">
                      Accuracy:{" "}
                      {Math.round(myLocation.accuracy)}m
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {visibleGuardians.map((guardian) => (
            <Marker
              key={guardian.id}
              position={[
                guardian.latitude as number,
                guardian.longitude as number,
              ]}
              icon={createGuardianIcon(
                guardian.presence,
                guardian.inEmergency,
                guardian.onJourney
              )}
            >
              <Popup>
                <div className="min-w-48">
                  <p className="font-bold">{guardian.name}</p>

                  <p className="mt-1 text-sm">
                    {guardian.relation || "Trusted Guardian"}
                  </p>

                  <div className="mt-3 space-y-1 text-xs">
                    <p>
                      Status:{" "}
                      {getPresenceLabel(guardian.presence)}
                    </p>

                    <p>
                      Last seen:{" "}
                      {formatLastSeen(guardian.lastSeen)}
                    </p>

                    <p>
                      Battery:{" "}
                      {guardian.batteryLevel !== null
                        ? `${guardian.batteryLevel}%`
                        : "Unknown"}
                    </p>

                    <p>
                      Network:{" "}
                      {guardian.networkStatus || "Unknown"}
                    </p>

                    {guardian.accuracy !== null && (
                      <p>
                        Accuracy:{" "}
                        {Math.round(guardian.accuracy)}m
                      </p>
                    )}

                    {guardian.onJourney && (
                      <p>🚗 Safe Journey active</p>
                    )}

                    {guardian.inEmergency && (
                      <p>🚨 Emergency active</p>
                    )}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${guardian.latitude},${guardian.longitude}`,
                            "_blank"
                          );
                        }}
                        className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
                      >
                        🧭 Get Directions
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
          🟢 Online
        </span>

        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-yellow-200">
          🟡 Recently active
        </span>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/50">
          ⚪ Offline
        </span>

        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300">
          🚨 Emergency
        </span>
      </div>
    </section>
  );
}