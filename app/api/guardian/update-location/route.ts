import { NextResponse } from "next/server";
import { EmergencySessionService } from "@/lib/emergency/EmergencySessionService";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sessionId = String(body.sessionId || "");
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!sessionId || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Session ID, latitude and longitude are required." },
        { status: 400 }
      );
    }

    await EmergencySessionService.updateLocation(
      sessionId,
      latitude,
      longitude
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guardian location error:", error);
    return NextResponse.json(
      { error: "Failed to update location." },
      { status: 500 }
    );
  }
}