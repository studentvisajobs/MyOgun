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

    const type = String(body.type || "NOTE");

    if (!["PHOTO", "VIDEO", "AUDIO", "LOCATION", "NOTE"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid evidence type." },
        { status: 400 }
      );
    }

    const evidence = await prisma.emergencyEvidence.create({
      data: {
        sessionId: body.sessionId || null,
        type: type as "PHOTO" | "VIDEO" | "AUDIO" | "LOCATION" | "NOTE",
        fileUrl: body.fileUrl || null,
        publicId: body.publicId || null,
        fileName: body.fileName || null,
        mimeType: body.mimeType || null,
        latitude:
          body.latitude === undefined || body.latitude === null
            ? null
            : Number(body.latitude),
        longitude:
          body.longitude === undefined || body.longitude === null
            ? null
            : Number(body.longitude),
        accuracy:
          body.accuracy === undefined || body.accuracy === null
            ? null
            : Number(body.accuracy),
        batteryLevel:
          body.batteryLevel === undefined || body.batteryLevel === null
            ? null
            : Number(body.batteryLevel),
        networkStatus: body.networkStatus || null,
        mode: body.mode || null,
        status: body.fileUrl ? "UPLOADED" : "PENDING",
      },
    });

    return NextResponse.json({ evidence });
  } catch (error) {
    console.error("Create evidence error:", error);

    return NextResponse.json(
      { error: "Failed to create evidence." },
      { status: 500 }
    );
  }
}