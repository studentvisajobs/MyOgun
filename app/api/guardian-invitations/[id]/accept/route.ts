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
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const invitation = await prisma.guardianInvitation.findUnique({
      where: {
        id,
      },
      include: {
        sender: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found." },
        { status: 404 }
      );
    }

    const isRecipient =
      invitation.receiverId === user.id ||
      invitation.receiverPhone === user.phone;

    if (!isRecipient) {
      return NextResponse.json(
        { error: "This invitation is not for you." },
        { status: 403 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation has already been processed." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.guardianInvitation.update({
        where: {
          id,
        },
        data: {
          status: "ACCEPTED",
          receiverId: user.id,
        },
      });

      const senderHasGuardian = await tx.guardianContact.findFirst({
        where: {
          userId: invitation.senderId,
          phone: user.phone,
        },
      });

      if (!senderHasGuardian) {
        await tx.guardianContact.create({
          data: {
            userId: invitation.senderId,
            name: user.name || invitation.receiverName || "Guardian",
            phone: user.phone,
            relation: invitation.relation,
          },
        });
      }

      const receiverHasGuardian = await tx.guardianContact.findFirst({
        where: {
          userId: user.id,
          phone: invitation.sender.phone,
        },
      });

      if (!receiverHasGuardian) {
        await tx.guardianContact.create({
          data: {
            userId: user.id,
            name: invitation.sender.name || "Guardian",
            phone: invitation.sender.phone,
            relation: invitation.relation,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: invitation.senderId,
          title: "Guardian Invitation Accepted",
          message: `${user.name || user.phone} accepted your guardian invitation.`,
          channel: "GUARDIAN",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Guardian invitation accepted.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to accept invitation.",
      },
      {
        status: 500,
      }
    );
  }
}