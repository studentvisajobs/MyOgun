"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
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

type ReverseGeocodeResponse = {
  display_name?: string;
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

function formatLastSeen(
  value: string | null
) {
  if (!value) {
    return "Never seen";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const milliseconds =
    Date.now() - date.getTime();

  const seconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  if (seconds < 10) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function getPresenceLabel(
  presence: MapGuardian["presence"]
) {
  if (presence === "ONLINE") {
    return "Online";
  }

  if (presence === "RECENT") {
    return "Recently active";
  }

  return "Offline";
}

function formatBattery(
  level: number | null
) {
  if (level === null) {
    return "Unknown";
  }

  const percentage =
    level <= 1
      ? Math.round(level * 100)
      : Math.round(level);

  return `${percentage}%`;
}

function GuardianAddress({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const [address, setAddress] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadAddress() {
      setLoading(true);
      setAddress(null);

      try {
        const params =
          new URLSearchParams({
            format: "jsonv2",
            lat: String(latitude),
            lon: String(longitude),
            zoom: "18",
            addressdetails: "1",
          });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Address lookup failed."
          );
        }

        const data =
          (await response.json()) as ReverseGeocodeResponse;

        setAddress(
          data.display_name ??
            "Address unavailable"
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setAddress(
          "Address unavailable"
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    void loadAddress();

    return () => {
      controller.abort();
    };
  }, [latitude, longitude]);

  return (
    <div>
      <p className="font-bold">
        Address
      </p>

      <p className="mt-1 leading-5">
        {loading
          ? "Finding address..."
          : address}
      </p>
    </div>
  );
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
    const emergencyGuardian =
      guardians.find(
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

    const onlineGuardian =
      guardians.find(
        (guardian) =>
          guardian.presence ===
            "ONLINE" &&
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
        [
          myLocation.latitude,
          myLocation.longitude,
        ],
        15
      );

      return;
    }

    const firstGuardian =
      guardians.find(
        (guardian) =>
          guardian.latitude !== null &&
          guardian.longitude !== null
      );

    if (firstGuardian) {
      map.setView(
        [
          firstGuardian.latitude as number,
          firstGuardian.longitude as number,
        ],
        15
      );
    }
  }, [
    map,
    myLocation,
    guardians,
  ]);

  return null;
}

function GuardianMarker({
  guardian,
}: {
  guardian: MapGuardian;
}) {
  const map = useMap();

  if (
    guardian.latitude === null ||
    guardian.longitude === null
  ) {
    return null;
  }

  const latitude =
    guardian.latitude;

  const longitude =
    guardian.longitude;

  function focusGuardian() {
    map.flyTo(
      [latitude, longitude],
      guardian.inEmergency
        ? 18
        : 17,
      {
        animate: true,
        duration: 0.8,
      }
    );
  }

  function openDirections() {
    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Marker
      position={[
        latitude,
        longitude,
      ]}
      icon={createGuardianIcon(
        guardian.presence,
        guardian.inEmergency,
        guardian.onJourney
      )}
      eventHandlers={{
        click: focusGuardian,
      }}
      riseOnHover
    >
      <Popup
        minWidth={250}
        maxWidth={320}
      >
        <div className="min-w-56">
          <div>
            <p className="text-base font-bold">
              {guardian.name}
            </p>

            <p className="mt-1 text-sm">
              {guardian.relation ||
                "Trusted Guardian"}
            </p>
          </div>

          {guardian.inEmergency && (
            <div className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700">
              🚨 Emergency active
            </div>
          )}

          {guardian.onJourney && (
            <div className="mt-3 rounded-lg bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-800">
              🚗 Safe Journey active
            </div>
          )}

          <div className="mt-4 border-t border-black/10 pt-3 text-xs">
            <GuardianAddress
              latitude={latitude}
              longitude={longitude}
            />
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="font-bold">
                Status:
              </span>{" "}
              {getPresenceLabel(
                guardian.presence
              )}
            </div>

            <div>
              <span className="font-bold">
                Last update:
              </span>{" "}
              {formatLastSeen(
                guardian.lastSeen
              )}
            </div>

            <div className="text-[11px] text-gray-500">
              {formatDateTime(
                guardian.lastSeen
              )}
            </div>

            <div>
              <span className="font-bold">
                Battery:
              </span>{" "}
              {formatBattery(
                guardian.batteryLevel
              )}
            </div>

            <div>
              <span className="font-bold">
                Network:
              </span>{" "}
              {guardian.networkStatus &&
              guardian.networkStatus !==
                "UNKNOWN"
                ? guardian.networkStatus
                : "Unknown"}
            </div>

            {guardian.accuracy !== null && (
              <div>
                <span className="font-bold">
                  GPS accuracy:
                </span>{" "}
                ±
                {Math.round(
                  guardian.accuracy
                )}
                m
              </div>
            )}

            <div>
              <span className="font-bold">
                Coordinates:
              </span>

              <div className="mt-1 font-mono text-[11px]">
                {latitude.toFixed(6)},{" "}
                {longitude.toFixed(6)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openDirections}
            className="mt-4 w-full rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-bold text-black transition hover:bg-emerald-400"
          >
            🧭 Get Directions
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default function GuardianCircleMap({
  myLocation,
  guardians,
}: Props) {
  const visibleGuardians =
    guardians.filter(
      (guardian) =>
        guardian.sharingLocation &&
        guardian.latitude !== null &&
        guardian.longitude !== null
    );

  const hasMapLocation =
    Boolean(myLocation) ||
    visibleGuardians.length > 0;

  if (!hasMapLocation) {
    return (
      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">
              Live Guardian Map
            </h2>

            <p className="mt-1 text-sm text-white/45">
              View guardians who are actively
              sharing their location.
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-white/45">
            0 visible
          </span>
        </div>

        <div className="mt-4 flex h-64 items-center justify-center rounded-[2rem] border border-white/10 bg-black/40 text-center">
          <div className="max-w-sm px-6">
            <p className="text-5xl">
              📍
            </p>

            <p className="mt-4 font-black">
              No live locations available
            </p>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Start sharing your location or
              wait for a registered guardian
              to share theirs.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const initialPosition:
    [number, number] =
    myLocation
      ? [
          myLocation.latitude,
          myLocation.longitude,
        ]
      : [
          visibleGuardians[0]
            .latitude as number,
          visibleGuardians[0]
            .longitude as number,
        ];

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">
            Live Guardian Map
          </h2>

          <p className="mt-1 text-sm text-white/45">
            Tap a Guardian to zoom to their
            exact location and view emergency
            details.
          </p>
        </div>

        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
          {visibleGuardians.length}{" "}
          guardian
          {visibleGuardians.length === 1
            ? ""
            : "s"}{" "}
          visible
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[2rem] border border-white/10">
        <MapContainer
          center={initialPosition}
          zoom={15}
          scrollWheelZoom
          className="h-80 w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoFitMap
            myLocation={myLocation}
            guardians={
              visibleGuardians
            }
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
                  <p className="font-bold">
                    You
                  </p>

                  <p className="mt-1 text-sm">
                    Your live location
                  </p>

                  <p className="mt-2 text-xs">
                    Last updated:{" "}
                    {formatLastSeen(
                      myLocation.updatedAt
                    )}
                  </p>

                  {myLocation.accuracy !==
                    null && (
                    <p className="mt-1 text-xs">
                      Accuracy: ±
                      {Math.round(
                        myLocation.accuracy
                      )}
                      m
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {visibleGuardians.map(
            (guardian) => (
              <GuardianMarker
                key={guardian.id}
                guardian={guardian}
              />
            )
          )}
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