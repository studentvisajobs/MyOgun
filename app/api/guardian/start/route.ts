import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const session = await GuardianSessionService.start({
      userId: user.id,
      latitude:
        body.latitude === undefined || body.latitude === null
          ? null
          : Number(body.latitude),
      longitude:
        body.longitude === undefined || body.longitude === null
          ? null
          : Number(body.longitude),
      batteryLevel:
        body.batteryLevel === undefined || body.batteryLevel === null
          ? body.battery === undefined || body.battery === null
            ? null
            : Number(body.battery)
          : Number(body.batteryLevel),
      networkStatus:
        typeof body.networkStatus === "string"
          ? body.networkStatus
          : typeof body.network === "string"
            ? body.network
            : null,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Guardian start error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to start Guardian Mode." },
      { status: 500 }
    );
  }
}