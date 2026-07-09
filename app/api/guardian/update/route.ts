import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const sessionId = String(body.sessionId || "");
    const message = String(body.message || "Guardian location updated.");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const latitude =
      body.latitude === undefined || body.latitude === null
        ? null
        : Number(body.latitude);

    const longitude =
      body.longitude === undefined || body.longitude === null
        ? null
        : Number(body.longitude);

    const accuracy =
      body.accuracy === undefined || body.accuracy === null
        ? null
        : Number(body.accuracy);

    const batteryLevel =
      body.batteryLevel === undefined || body.batteryLevel === null
        ? null
        : Number(body.batteryLevel);

    const networkStatus = String(body.networkStatus || "UNKNOWN");

    const session = await prisma.guardianSession.update({
      where: {
        id: sessionId,
        userId: user.id,
      },
      data: {
        latitude,
        longitude,
        batteryLevel,
        networkStatus,
        locations:
          latitude !== null && longitude !== null
            ? {
                create: {
                  latitude,
                  longitude,
                  accuracy,
                },
              }
            : undefined,
        timeline: {
          create: {
            message,
            latitude,
            longitude,
          },
        },
      },
      include: {
        locations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        timeline: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Guardian update error:", error);

    return NextResponse.json(
      { error: "Failed to update Guardian session." },
      { status: 500 }
    );
  }
}