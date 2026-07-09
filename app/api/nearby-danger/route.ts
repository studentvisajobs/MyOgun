import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { distanceInMeters } from "@/lib/location/distance";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") || 5000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Latitude and longitude are required." },
      { status: 400 }
    );
  }

  const incidents = await prisma.incident.findMany({
    where: {
      status: {
        in: ["PENDING", "VERIFIED", "CRITICAL", "RESPONDING"],
      },
    },
    include: {
      evidence: true,
      confirmations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const nearby = incidents
    .map((incident) => {
      const distance = distanceInMeters(
        lat,
        lng,
        incident.latitude,
        incident.longitude
      );

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
        distance,
        evidenceCount: incident.evidence.length,
        witnessCount: incident.confirmations.filter(
          (item) => item.vote === "CONFIRM"
        ).length,
      };
    })
    .filter((item) => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  return NextResponse.json({
    success: true,
    nearby,
    closest: nearby[0] || null,
  });
}