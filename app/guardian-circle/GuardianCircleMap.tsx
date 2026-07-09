"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Location = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
};

type Guardian = {
  id: string;
  name: string;
  relation: string | null;
};

type Props = {
  myLocation: Location | null;
  guardians: Guardian[];
};

const userIcon = L.divIcon({
  className: "",
  html: `<div style="height:32px;width:32px;border-radius:999px;background:#10b981;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const guardianIcon = L.divIcon({
  className: "",
  html: `<div style="height:32px;width:32px;border-radius:999px;background:#111827;border:3px solid #10b981;display:flex;align-items:center;justify-content:center;font-size:16px;">👤</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function GuardianCircleMap({
  myLocation,
  guardians,
}: Props) {
  if (!myLocation) {
    return (
      <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        <h2 className="text-2xl font-black">Live Map</h2>

        <div className="mt-4 flex h-64 items-center justify-center rounded-[2rem] border border-white/10 bg-black/40 text-center">
          <div>
            <p className="text-5xl">📍</p>
            <p className="mt-4 font-black">Location not shared yet</p>
            <p className="mt-2 text-sm text-white/50">
              Start live sharing to show your position on the map.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
      <h2 className="text-2xl font-black">Live Map</h2>

      <div className="mt-4 overflow-hidden rounded-[2rem] border border-white/10">
        <MapContainer
          center={[myLocation.latitude, myLocation.longitude]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-72 w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={[myLocation.latitude, myLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              You are here
              <br />
              Updated live
            </Popup>
          </Marker>

          {guardians.map((guardian, index) => {
            // Temporary demo positioning near user until guardian live sharing is connected.
            const offset = (index + 1) * 0.0015;

            return (
              <Marker
                key={guardian.id}
                position={[
                  myLocation.latitude + offset,
                  myLocation.longitude + offset,
                ]}
                icon={guardianIcon}
              >
                <Popup>
                  {guardian.name}
                  <br />
                  {guardian.relation || "Trusted Guardian"}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}