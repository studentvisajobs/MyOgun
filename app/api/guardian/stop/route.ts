import { NextResponse } from "next/server";
import { EmergencySessionService } from "@/lib/emergency/EmergencySessionService";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sessionId = String(body.sessionId || "");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const session = await EmergencySessionService.stop(sessionId);

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Guardian stop error:", error);
    return NextResponse.json(
      { error: "Failed to stop Guardian Mode." },
      { status: 500 }
    );
  }
}