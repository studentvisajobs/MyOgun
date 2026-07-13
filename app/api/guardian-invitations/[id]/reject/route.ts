import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const invitation = await prisma.guardianInvitation.findUnique({
      where: {
        id,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 }
      );
    }

    if (
      invitation.receiverId !== user.id &&
      invitation.receiverPhone !== user.phone
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.guardianInvitation.update({
      where: {
        id,
      },
      data: {
        status: "REJECTED",
        receiverId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation rejected.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to reject invitation.",
      },
      {
        status: 500,
      }
    );
  }
}