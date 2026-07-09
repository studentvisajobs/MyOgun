"use client";

import { useEffect, useState } from "react";

type DangerAlert = {
  id: string;
  title: string;
  type: string;
  status: string;
  confidenceScore: number;
  distance: number;
  radius: number;
  area: string | null;
  localGovernment: string | null;
};

export default function DangerBanner() {
  const [danger, setDanger] = useState<DangerAlert | null>(null);

  useEffect(() => {
    async function checkDanger() {
      try {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch("/api/nearby-danger", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }),
              });

              if (!response.ok) {
                console.log("Nearby danger API failed");
                return;
              }

              const data = await response.json();

              if (data.danger && data.incident) {
                setDanger(data.incident);

                if (navigator.vibrate) {
                  navigator.vibrate([700, 300, 700]);
                }
              } else {
                setDanger(null);
              }
            } catch (error) {
              console.log("Danger check failed:", error);
            }
          },
          () => {
            console.log("Location permission denied for danger scan.");
          }
        );
      } catch (error) {
        console.log("Danger scanner error:", error);
      }
    }

    checkDanger();

    const timer = setInterval(checkDanger, 30000);

    return () => clearInterval(timer);
  }, []);

  if (!danger) return null;

  return (
    <a
      href={`/incidents/${danger.id}`}
      className="block bg-red-700 px-4 py-3 text-center font-bold text-white animate-pulse"
    >
      🚨 DANGER NEARBY: {danger.title} • {danger.distance}km away • Click for
      details
    </a>
  );
}