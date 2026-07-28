"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Map,
  Marker,
  Popup,
  NavigationControl,
  AttributionControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_CONFIG } from "@/lib/config/map";

type UserLocation = {
  latitude: number;
  longitude: number;
};

type MapIncident = {
  id: string;
  type: string;
  status: string;
  threatLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  threatScore: number;
  latitude: number | null;
  longitude: number | null;
};

type GuardianLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  status: string;
  updatedAt: string;
};

const DEFAULT_LOCATION: UserLocation = {
  latitude: 7.1475,
  longitude: 3.3619,
};

export default function SafetyMap() {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<Map | null>(null);

  const userMarkerRef =
    useRef<Marker | null>(null);

  const incidentMarkersRef =
    useRef<Marker[]>([]);

  const guardianMarkersRef =
    useRef<Marker[]>([]);

  const [incidents, setIncidents] =
    useState<MapIncident[]>([]);

  const [guardians, setGuardians] =
    useState<GuardianLocation[]>([]);

  const [locationStatus, setLocationStatus] =
    useState<
      "loading" | "available" | "unavailable"
    >("loading");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadIncidents = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/map/incidents",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "Unable to load incidents:",
          response.status
        );

        return;
      }

      const data: MapIncident[] =
        await response.json();

      setIncidents(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Unable to load incidents:",
        error
      );
    }
  }, []);

  const loadGuardians = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/map/guardians",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "Unable to load guardian locations:",
          response.status
        );

        return;
      }

      const data: GuardianLocation[] =
        await response.json();

      setGuardians(data);
    } catch (error) {
      console.error(
        "Unable to load guardian locations:",
        error
      );
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new Map({
      container: containerRef.current,
      style: MAP_CONFIG.style,
      center: [
        DEFAULT_LOCATION.longitude,
        DEFAULT_LOCATION.latitude,
      ],
      zoom: MAP_CONFIG.defaultZoom,
      attributionControl: false,
    });

    map.addControl(
      new NavigationControl(),
      "top-right"
    );

    map.addControl(
      new AttributionControl({
        compact: true,
      })
    );

    mapRef.current = map;

    function showUserLocation(
      location: UserLocation
    ) {
      if (!mapRef.current) {
        return;
      }

      const coordinates: [number, number] = [
        location.longitude,
        location.latitude,
      ];

      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(
          coordinates
        );
      } else {
        const markerElement =
          document.createElement("div");

        markerElement.className =
          "h-5 w-5 rounded-full border-4 border-white bg-blue-600 shadow-lg";

        markerElement.setAttribute(
          "aria-label",
          "Your current location"
        );

        userMarkerRef.current =
          new Marker({
            element: markerElement,
          })
            .setLngLat(coordinates)
            .setPopup(
              new Popup({
                offset: 18,
              }).setText("Your current location")
            )
            .addTo(mapRef.current);
      }

      mapRef.current.flyTo({
        center: coordinates,
        zoom: MAP_CONFIG.userZoom,
        essential: true,
      });
    }

    if (!navigator.geolocation) {
      setLocationStatus("unavailable");

      return () => {
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;

        incidentMarkersRef.current.forEach(
          (marker) => marker.remove()
        );
        incidentMarkersRef.current = [];

        guardianMarkersRef.current.forEach(
          (marker) => marker.remove()
        );
        guardianMarkersRef.current = [];

        map.remove();
        mapRef.current = null;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        showUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationStatus("available");
      },
      (error) => {
        console.warn(
          "Unable to retrieve map location:",
          error.message
        );

        setLocationStatus("unavailable");
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      }
    );

    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;

      incidentMarkersRef.current.forEach(
        (marker) => marker.remove()
      );
      incidentMarkersRef.current = [];

      guardianMarkersRef.current.forEach(
        (marker) => marker.remove()
      );
      guardianMarkersRef.current = [];

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    void loadIncidents();
    void loadGuardians();

    const interval = window.setInterval(() => {
      void loadIncidents();
      void loadGuardians();
    }, MAP_CONFIG.refreshInterval);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadIncidents, loadGuardians]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    incidentMarkersRef.current.forEach(
      (marker) => marker.remove()
    );

    incidentMarkersRef.current = [];

    incidents.forEach((incident) => {
      if (
        incident.latitude == null ||
        incident.longitude == null
      ) {
        return;
      }

      const element =
        document.createElement("div");

      element.style.width = "18px";
      element.style.height = "18px";
      element.style.borderRadius = "50%";
      element.style.backgroundColor = markerColor(
        incident.threatLevel
      );
      element.style.border = "3px solid white";
      element.style.boxShadow =
        "0 0 10px rgba(0,0,0,.35)";
      element.style.cursor = "pointer";

      element.setAttribute(
        "aria-label",
        `${incident.type} incident, ${incident.threatLevel} threat`
      );

      element.setAttribute("role", "button");
      element.tabIndex = 0;

      const marker = new Marker({
        element,
      })
        .setLngLat([
          incident.longitude,
          incident.latitude,
        ])
        .setPopup(
          new Popup({
            offset: 14,
          }).setDOMContent(
            createIncidentPopup(incident)
          )
        )
        .addTo(mapRef.current!);

      incidentMarkersRef.current.push(marker);
    });

    return () => {
      incidentMarkersRef.current.forEach(
        (marker) => marker.remove()
      );

      incidentMarkersRef.current = [];
    };
  }, [incidents]);

  useEffect(() => {
  if (!mapRef.current) {
    return;
  }

  guardianMarkersRef.current.forEach((marker) =>
    marker.remove()
  );

  guardianMarkersRef.current = [];

  guardians.forEach((guardian) => {
    const marker = new Marker({
      element: createGuardianMarker(),
    })
      .setLngLat([
        guardian.longitude,
        guardian.latitude,
      ])
      .setPopup(
        new Popup({ offset: 14 }).setDOMContent(
            createGuardianPopup(guardian)
        )
        )
      .addTo(mapRef.current!);

    guardianMarkersRef.current.push(marker);
  });

  return () => {
    guardianMarkersRef.current.forEach((marker) =>
      marker.remove()
    );

    guardianMarkersRef.current = [];
  };
}, [guardians]);

  function createIncidentPopup(
    incident: MapIncident
  ) {
    const container =
      document.createElement("div");

    const title =
      document.createElement("strong");

    title.textContent = incident.type;

    const threat =
      document.createElement("p");

    threat.textContent =
      `Threat: ${incident.threatLevel}`;

    const score =
      document.createElement("p");

    score.textContent =
      `Score: ${incident.threatScore}`;

    container.append(title, threat, score);

    return container;
  }


  function createGuardianPopup(
  guardian: GuardianLocation
) {
  const container = document.createElement("div");

  const title = document.createElement("strong");
  title.textContent = guardian.name;

  const status = document.createElement("p");
  status.textContent = `Status: ${guardian.status}`;

  const accuracy = document.createElement("p");
  accuracy.textContent =
    guardian.accuracy != null
      ? `Accuracy: ${Math.round(
          guardian.accuracy
        )} m`
      : "Accuracy unavailable";

  const updated = document.createElement("p");
  updated.textContent = `Updated: ${new Date(
    guardian.updatedAt
  ).toLocaleTimeString()}`;

  container.append(
    title,
    status,
    accuracy,
    updated
  );

  return container;
}


  function formatLastUpdated() {
    if (!lastUpdated) {
      return "Loading live incidents...";
    }

    return `Live updates active — ${lastUpdated.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    )}`;
  }

  function markerColor(
    level: MapIncident["threatLevel"]
  ) {
    switch (level) {
      case "CRITICAL":
        return "#dc2626";

      case "HIGH":
        return "#f97316";

      case "MEDIUM":
        return "#eab308";

      default:
        return "#16a34a";
    }
  }

function createGuardianMarker() {
  const element = document.createElement("div");

  element.style.width = "20px";
  element.style.height = "20px";
  element.style.borderRadius = "50%";
  element.style.backgroundColor = "#2563eb";
  element.style.border = "4px solid white";
  element.style.boxShadow =
    "0 0 12px rgba(37,99,235,.55)";
  element.style.cursor = "pointer";

  element.setAttribute(
    "aria-label",
    "Guardian location"
  );

  element.setAttribute(
    "role",
    "button"
  );

  element.tabIndex = 0;

  return element;
}


  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="MyOgun interactive safety map"
      />

      <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-sm font-semibold text-slate-900">
          MyOgun Safety Map
        </p>

        <p className="mt-1 text-xs font-medium text-green-600">
          🟢 {formatLastUpdated()}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {locationStatus === "loading" &&
            "Finding your location..."}

          {locationStatus === "available" &&
            "Showing your current location"}

          {locationStatus === "unavailable" &&
            "Location unavailable — showing Abeokuta"}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Guardians sharing location:{" "}
          {guardians.length}
        </p>
      </div>

      <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Threat levels
        </p>

        <div className="mt-2 space-y-1.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-600" />
            <span>Critical</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            <span>High</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span>Medium</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-600" />
            <span>Low</span>
          </div>
        </div>
      </div>
    </section>
  );
}