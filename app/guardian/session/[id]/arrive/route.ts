import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionService,
  GuardianSessionError,
} from "@/lib/services/GuardianSessionService";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  req: Request,
  { params }: Params
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const responder =
      await GuardianSessionService.arrive(
        id,
        user.id
      );

    return NextResponse.json({
      success: true,
      responder,
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

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}