import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await GuardianSessionService.getActive(
        user.id
      );

    return NextResponse.json({
      success: true,
      session: session ?? null,
    });
  } catch (error) {
    if (
      error instanceof GuardianSessionError
    ) {
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

    console.error(
      "Get active guardian session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve the active emergency session.",
      },
      {
        status: 500,
      }
    );
  }
}