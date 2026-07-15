"use client";

import { useMemo, useState } from "react";
import MyOgunIntelligenceCard from "../intelligence/MyOgunIntelligenceCard";
import NearbyDangerAlert from "./NearbyDangerAlert";

type NearbyDanger = {
  id: string;
  title: string;
  type: string;
  status: string;
  distance: number;
  area?: string | null;
  localGovernment?: string | null;
} | null;

type Props = {
  guardianCount: number;
  sharingLocation: boolean;
  emergencyContacts: number;
};

function formatDistance(distance: number) {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }

  return `${(distance / 1000).toFixed(1)}km`;
}

export default function HomeSafetyIntelligence({
  guardianCount,
  sharingLocation,
  emergencyContacts,
}: Props) {
  const [nearbyDanger, setNearbyDanger] =
    useState<NearbyDanger>(null);

  const intelligence = useMemo(() => {
    if (nearbyDanger) {
      const distance = nearbyDanger.distance;

      if (distance <= 500) {
        return {
          title: "Immediate danger detected",
          summary: `${nearbyDanger.title} has been reported approximately ${formatDistance(
            distance
          )} from your current location.`,
          recommendation:
            "Move away from the area immediately, stay alert, share your live location and contact your guardians if you feel unsafe.",
          score: 10,
        };
      }

      if (distance <= 1000) {
        return {
          title: "Serious danger nearby",
          summary: `${nearbyDanger.title} has been reported ${formatDistance(
            distance
          )} away.`,
          recommendation:
            "Avoid the affected area, remain aware of your surroundings and keep your guardians informed.",
          score: 25,
        };
      }

      return {
        title: "Safety alert in your area",
        summary: `${nearbyDanger.title} has been reported ${formatDistance(
          distance
        )} from your current location.`,
        recommendation:
          "Stay alert, review the incident details and avoid travelling toward the affected area.",
        score: 50,
      };
    }

    let score = 100;
    const recommendations: string[] = [];

    if (guardianCount === 0) {
      score -= 25;
      recommendations.push("Add at least one trusted guardian.");
    }

    if (!sharingLocation) {
      score -= 15;
      recommendations.push(
        "Enable live location sharing for better protection."
      );
    }

    if (emergencyContacts === 0) {
      score -= 15;
      recommendations.push(
        "Add an emergency contact to strengthen your safety setup."
      );
    }

    return {
      title:
        score >= 80
          ? "Everything looks normal"
          : "Improve your safety readiness",
      summary:
        score >= 80
          ? "No nearby danger has been detected from your current location."
          : "No immediate nearby danger was detected, but your safety setup can be improved.",
      recommendation:
        recommendations.length > 0
          ? recommendations.join(" ")
          : "Stay aware of your surroundings and keep MyOgun active.",
      score,
    };
  }, [
    nearbyDanger,
    guardianCount,
    sharingLocation,
    emergencyContacts,
  ]);

  return (
    <>
      <MyOgunIntelligenceCard
        title={intelligence.title}
        summary={intelligence.summary}
        recommendation={intelligence.recommendation}
        score={intelligence.score}
      />

      <NearbyDangerAlert onDangerChange={setNearbyDanger} />
    </>
  );
}