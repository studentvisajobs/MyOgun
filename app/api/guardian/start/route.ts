import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { EmergencySessionService } from "@/lib/emergency/EmergencySessionService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = await req.json();

    const session = await EmergencySessionService.startGuardianMode({
      userId: user.id,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      battery: body.battery ?? null,
      network: body.network ?? null,
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Guardian start error:", error);
    return NextResponse.json(
      { error: "Failed to start Guardian Mode." },
      { status: 500 }
    );
  }
}