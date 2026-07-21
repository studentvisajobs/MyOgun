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

    if (!activeSession || activeSession.id !== sessionId) {
      return NextResponse.json(
        { error: "Active Guardian session not found." },
        { status: 404 }
      );
    }

    const session = await GuardianSessionService.stop(sessionId);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Guardian stop error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to stop Guardian Mode." },
      { status: 500 }
    );
  }
}