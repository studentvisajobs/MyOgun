export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { calculateDistanceKm } from "@/lib/danger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const latitude = Number(searchParams.get("latitude"));
  const longitude = Number(searchParams.get("longitude"));

  if (!latitude || !longitude) {
    return Response.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  const incidents = await prisma.incident.findMany({
    where: {
      OR: [{ status: "VERIFIED" }, { status: "CRITICAL" }],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const nearbyIncidents = incidents
    .map((incident) => {
      const distanceKm = calculateDistanceKm(
        latitude,
        longitude,
        incident.latitude,
        incident.longitude
      );

      return {
        ...incident,
        distanceKm,
      };
    })
    .filter((incident) => {
      if (incident.status === "CRITICAL") {
        return incident.distanceKm <= 2;
      }

      return incident.distanceKm <= 1;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return Response.json({
    success: true,
    nearbyIncidents,
  });
}