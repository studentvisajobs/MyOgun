import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GuardianService } from "@/lib/services/GuardianService";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const network = await GuardianService.getNetwork(
      currentUser.id
    );

    return NextResponse.json(
      {
        success: true,
        guardians: network.guardians,
        summary: network.summary,
        checkedAt: network.checkedAt,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Guardian network GET error:", error);

    return NextResponse.json(
      {
        error: "Unable to load the Guardian Network.",
      },
      {
        status: 500,
      }
    );
  }
}