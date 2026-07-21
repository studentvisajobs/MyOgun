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
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const location =
      await GuardianSessionService.getLocation(
        id,
        user.id
      );

    return NextResponse.json(
      {
        success: true,
        location,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Guardian location GET error:",
      error
    );

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load the guardian location.",
      },
      {
        status: 500,
      }
    );
  }
}