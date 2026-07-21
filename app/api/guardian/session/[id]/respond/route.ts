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

export async function POST(
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

    const responder =
      await GuardianSessionService.respond(
        id,
        user.id
      );

    return NextResponse.json(
      {
        success: true,
        responder,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Guardian respond POST error:",
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
          "Unable to acknowledge guardian response.",
      },
      {
        status: 500,
      }
    );
  }
}