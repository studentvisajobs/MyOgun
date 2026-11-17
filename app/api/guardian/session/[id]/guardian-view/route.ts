
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const emergency =
      await GuardianSessionService.getGuardianEmergency(
        id,
        user.id
      );

    return NextResponse.json({
      success: true,
      emergency,
    });
  } catch (error) {
    console.error(
      "Guardian emergency view error:",
      error
    );

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load emergency.",
      },
      { status: 500 }
    );
  }
}
