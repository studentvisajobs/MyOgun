import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  JourneyService,
  JourneyServiceError,
} from "@/lib/services/JourneyService";

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

    const journey = await JourneyService.stop({
      userId: user.id,
      journeyId: String(body.journeyId || ""),
    });

    return NextResponse.json({
      success: true,
      journey,
    });
  } catch (error) {
    console.error("Stop journey error:", error);

    if (error instanceof JourneyServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to stop journey." },
      { status: 500 }
    );
  }
}