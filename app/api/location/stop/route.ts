import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LocationService } from "@/lib/services/LocationService";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const location = await LocationService.stopSharing(
      user.id
    );

    return NextResponse.json({
      success: true,
      message: "Location sharing stopped.",
      location,
    });
  } catch (error) {
    console.error(
      "Stop location sharing error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to stop location sharing." },
      { status: 500 }
    );
  }
}