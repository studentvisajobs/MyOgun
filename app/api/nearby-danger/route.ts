import { NextResponse } from "next/server";
import {
  IncidentService,
  IncidentServiceError,
} from "@/lib/services/IncidentService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const latitude = Number(searchParams.get("lat"));
    const longitude = Number(searchParams.get("lng"));

    const requestedRadius = Number(
      searchParams.get("radius") || 5000
    );

    const radius = Math.min(
      50_000,
      Math.max(100, requestedRadius)
    );

    const incidents = await IncidentService.getNearby(
      latitude,
      longitude,
      radius
    );

    const nearby = incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      type: incident.type,
      status: incident.status,
      confidenceScore: incident.confidenceScore,
      area: incident.area,
      localGovernment: incident.localGovernment,
      latitude: incident.latitude,
      longitude: incident.longitude,
      distance: incident.distance,
      evidenceCount: incident.evidence.length,
      witnessCount: incident.confirmations.filter(
        (confirmation) =>
          confirmation.vote === "CONFIRM"
      ).length,
    }));

    return NextResponse.json({
      success: true,
      nearby,
      closest: nearby[0] || null,
    });
  } catch (error) {
    console.error("Nearby danger GET error:", error);

    if (error instanceof IncidentServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Unable to check nearby danger." },
      { status: 500 }
    );
  }
}