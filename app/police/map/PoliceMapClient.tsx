"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

type Incident = {
  id: string;
  title: string;
  type: string;
  status: string;
  confidenceScore: number;
  latitude: number;
  longitude: number;
};

function markerColor(type: string) {
  if (type === "KIDNAPPING") return "#ef4444";
  if (type === "ROBBERY") return "#f97316";
  if (type === "SUSPICIOUS_ACTIVITY") return "#facc15";
  if (type === "ACCIDENT") return "#3b82f6";
  return "#10b981";
}

function markerLabel(type: string) {
  if (type === "KIDNAPPING") return "🚨";
  if (type === "ROBBERY") return "🟠";
  if (type === "SUSPICIOUS_ACTIVITY") return "⚠️";
  if (type === "ACCIDENT") return "🚗";
  return "📍";
}

function iconFor(type: string) {
  const color = markerColor(type);

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background: ${color};
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 0 25px ${color};
      ">
        ${markerLabel(type)}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function PoliceMapClient({
  incidents,
}: {
  incidents: Incident[];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <MapContainer
        center={[7.15, 3.35]}
        zoom={10}
        style={{
          height: "700px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidents.map((incident) => (
          <div key={incident.id}>
            <Marker
              position={[incident.latitude, incident.longitude]}
              icon={iconFor(incident.type)}
            >
              <Popup>
                <div>
                  <h3>
                    <strong>{incident.title}</strong>
                  </h3>

                  <p>{incident.type.replaceAll("_", " ")}</p>

                  <p>
                    {incident.status} • {incident.confidenceScore}% confidence
                  </p>

                  <a
                    href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                    target="_blank"
                  >
                    Open Location
                  </a>

                  <br />

                  <a href={`/incidents/${incident.id}`}>Open Incident</a>
                </div>
              </Popup>
            </Marker>

            {(incident.status === "CRITICAL" ||
              incident.status === "VERIFIED") && (
              <Circle
                center={[incident.latitude, incident.longitude]}
                radius={incident.status === "CRITICAL" ? 5000 : 2000}
                pathOptions={{
                  color: markerColor(incident.type),
                  fillColor: markerColor(incident.type),
                  fillOpacity: 0.15,
                }}
              />
            )}
          </div>
        ))}
      </MapContainer>
    </div>
  );
}