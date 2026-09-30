import { NextResponse } from "next/server";
import {
  IncidentService,
  IncidentServiceError,
} from "@/lib/services/IncidentService";

function parseCoordinate(
  value: string | null
): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseRadius(
  value: string | null
): number {
  const parsed = Number(value ?? 5000);

  if (!Number.isFinite(parsed)) {
    return 5000;
  }

  return Math.min(
    50_000,
    Math.max(100, parsed)
  );
}

function formatIncident(
  incident: Awaited<
    ReturnType<typeof IncidentService.getNearby>
  >[number]
) {
  return {
    id: incident.id,
    title: incident.title,
    type: incident.type,
    status: incident.status,
    confidenceScore: incident.confidenceScore,
    area: incident.area,
    localGovernment: incident.localGovernment,
    latitude: incident.latitude,
    longitude: incident.longitude,

    // IncidentService returns distance in metres.
    distance: incident.distance,
    distanceKm: incident.distance / 1000,

    evidenceCount: incident.evidence.length,

    witnessCount: incident.confirmations.filter(
      (confirmation) =>
        confirmation.vote === "CONFIRM"
    ).length,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Support both parameter formats already used
    // throughout the application.
    const latitude = parseCoordinate(
      searchParams.get("lat") ??
        searchParams.get("latitude")
    );

    const longitude = parseCoordinate(
      searchParams.get("lng") ??
        searchParams.get("longitude")
    );

    if (
      latitude === null ||
      longitude === null
    ) {
      return NextResponse.json(
        {
          error:
            "Valid latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    const radius = parseRadius(
      searchParams.get("radius")
    );

    const incidents =
      await IncidentService.getNearby(
        latitude,
        longitude,
        radius
      );

    const nearby = incidents.map(formatIncident);

    return NextResponse.json({
      success: true,
      nearby,
      closest: nearby[0] ?? null,
    });
  } catch (error) {
    console.error(
      "Nearby danger GET error:",
      error
    );

    if (error instanceof IncidentServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to check nearby danger.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const latitude =
      typeof body.latitude === "number"
        ? body.latitude
        : Number(body.latitude);

    const longitude =
      typeof body.longitude === "number"
        ? body.longitude
        : Number(body.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          error:
            "Valid latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    const requestedRadius = Number(
      body.radius ?? 5000
    );

    const radius = Number.isFinite(
      requestedRadius
    )
      ? Math.min(
          50_000,
          Math.max(100, requestedRadius)
        )
      : 5000;

    const incidents =
      await IncidentService.getNearby(
        latitude,
        longitude,
        radius
      );

    const nearby = incidents.map(formatIncident);
    const closest = nearby[0] ?? null;

    return NextResponse.json({
      success: true,

      // Existing GET-style response
      nearby,
      closest,

      // Existing DangerBanner response contract
      danger: closest !== null,
      incident: closest
        ? {
            ...closest,
            // DangerBanner displays this value as km.
            distance: Number(
              closest.distanceKm.toFixed(2)
            ),
            radius: radius / 1000,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Nearby danger POST error:",
      error
    );

    if (error instanceof IncidentServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to check nearby danger.",
      },
      { status: 500 }
    );
  }
}