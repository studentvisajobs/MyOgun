import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = await req.json();

    const destination = String(body.destination || "").trim();

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required." },
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

    const estimatedArrival = body.estimatedArrival
      ? new Date(body.estimatedArrival)
      : null;

    const journey = await prisma.safeJourney.create({
      data: {
        userId: user.id,
        destination,
        startAddress: body.startAddress || null,
        estimatedArrival,
        latitude,
        longitude,
        status: "ACTIVE",
        timeline: {
          create: {
            message: "Safe Journey started.",
            latitude,
            longitude,
          },
        },
      },
      include: {
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error("Start journey error:", error);
    return NextResponse.json(
      { error: "Failed to start journey." },
      { status: 500 }
    );
  }
}