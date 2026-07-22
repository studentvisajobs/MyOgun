import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  JourneyService,
  JourneyServiceError,
} from "@/lib/services/JourneyService";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const journey = await JourneyService.getActive(
      user.id
    );

    return NextResponse.json({
      success: true,
      journey,
    });
  } catch (error) {
    console.error(
      "Get active journey error:",
      error
    );

    if (error instanceof JourneyServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to retrieve active journey.",
      },
      { status: 500 }
    );
  }
}