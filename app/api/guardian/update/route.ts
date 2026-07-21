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
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId.trim()
        : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const activeSession =
      await GuardianSessionService.getActive(user.id);
    
    console.log("Guardian update check:", {
  userId: user.id,
  requestedSessionId: sessionId,
  activeSessionId: activeSession?.id ?? null,
  activeSessionStatus: activeSession?.status ?? null,
   });

    if (!activeSession || activeSession.id !== sessionId) {
      return NextResponse.json(
        { error: "Active Guardian session not found." },
        { status: 404 }
      );
    }

    const session = await GuardianSessionService.update(
      sessionId,
      {
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
          body.batteryLevel === undefined ||
          body.batteryLevel === null
            ? null
            : Number(body.batteryLevel),
        networkStatus:
          typeof body.networkStatus === "string"
            ? body.networkStatus
            : null,
        message:
          typeof body.message === "string" && body.message.trim()
            ? body.message.trim()
            : "Guardian location updated.",
      }
    );

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Guardian update error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to update Guardian session." },
      { status: 500 }
    );
  }
}