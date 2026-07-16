import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianService,
  GuardianServiceError,
} from "@/lib/services/GuardianService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    await GuardianService.rejectInvitation({
      invitationId: id,
      receiverId: user.id,
      receiverName: user.name,
      receiverPhone: user.phone,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation rejected.",
    });
  } catch (error) {
    console.error(
      "Reject guardian invitation error:",
      error
    );

    if (error instanceof GuardianServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Unable to reject invitation." },
      { status: 500 }
    );
  }
}