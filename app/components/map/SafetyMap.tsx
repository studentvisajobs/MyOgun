"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map,
  Marker,
  Popup,
  NavigationControl,
  AttributionControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type UserLocation = {
  latitude: number;
  longitude: number;
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

  const [locationStatus, setLocationStatus] =
    useState<
      "loading" | "available" | "unavailable"
    >("loading");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new Map({
      container: containerRef.current,
      style:
        "https://demotiles.maplibre.org/style.json",
      center: [
        DEFAULT_LOCATION.longitude,
        DEFAULT_LOCATION.latitude,
      ],
      zoom: 11,
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
        zoom: 14,
        essential: true,
      });
    }

    if (!navigator.geolocation) {
      setLocationStatus("unavailable");

      return () => {
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;

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

      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label="MyOgun interactive safety map"
      />

      <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-sm font-semibold text-slate-900">
          MyOgun Safety Map
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {locationStatus === "loading" &&
            "Finding your location..."}

          {locationStatus === "available" &&
            "Showing your current location"}

          {locationStatus === "unavailable" &&
            "Location unavailable — showing Abeokuta"}
        </p>
      </div>
    </section>
  );
}