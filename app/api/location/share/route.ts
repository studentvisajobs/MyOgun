import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    const accuracy =
      body.accuracy === undefined || body.accuracy === null
        ? null
        : Number(body.accuracy);

    const batteryLevel =
      body.batteryLevel === undefined || body.batteryLevel === null
        ? null
        : Number(body.batteryLevel);

    const networkStatus =
    typeof body.networkStatus === "string" &&
    body.networkStatus.trim()
      ? body.networkStatus.trim().toUpperCase()
      : "ONLINE";

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required." },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90." },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Longitude must be between -180 and 180." },
        { status: 400 }
      );
    }

    const location = await prisma.sharedLocation.upsert({
      where: {
        userId: user.id,
      },
      update: {
        latitude,
        longitude,
        accuracy:
          accuracy !== null && Number.isFinite(accuracy)
            ? accuracy
            : null,
        batteryLevel:
          batteryLevel !== null && Number.isFinite(batteryLevel)
            ? Math.max(0, Math.min(100, Math.round(batteryLevel)))
            : null,
        status: networkStatus,
      },
      create: {
        userId: user.id,
        latitude,
        longitude,
        accuracy:
          accuracy !== null && Number.isFinite(accuracy)
            ? accuracy
            : null,
        batteryLevel:
          batteryLevel !== null && Number.isFinite(batteryLevel)
            ? Math.max(0, Math.min(100, Math.round(batteryLevel)))
            : null,
        status: networkStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Location shared successfully.",
      location,
    });
  } catch (error) {
    console.error("Share location error:", error);

    return NextResponse.json(
      { error: "Unable to share location." },
      { status: 500 }
    );
  }
}