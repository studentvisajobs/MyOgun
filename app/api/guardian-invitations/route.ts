import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const [sentInvitations, receivedInvitations] = await Promise.all([
      prisma.guardianInvitation.findMany({
        where: {
          senderId: user.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.guardianInvitation.findMany({
        where: {
          OR: [
            {
              receiverId: user.id,
            },
            {
              receiverPhone: user.phone,
            },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return NextResponse.json({
      sent: sentInvitations,
      received: receivedInvitations,
    });
  } catch (error) {
    console.error("GET guardian invitations error:", error);

    return NextResponse.json(
      { error: "Unable to load guardian invitations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const receiverName =
      typeof body.receiverName === "string"
        ? body.receiverName.trim()
        : "";

    const receiverPhone =
      typeof body.receiverPhone === "string"
        ? normalizePhone(body.receiverPhone)
        : "";

    const relation =
      typeof body.relation === "string"
        ? body.relation.trim()
        : null;

    if (!receiverName) {
      return NextResponse.json(
        { error: "Guardian name is required." },
        { status: 400 }
      );
    }

    if (!receiverPhone) {
      return NextResponse.json(
        { error: "Guardian phone number is required." },
        { status: 400 }
      );
    }

    const normalizedUserPhone = normalizePhone(user.phone);

    if (receiverPhone === normalizedUserPhone) {
      return NextResponse.json(
        { error: "You cannot invite yourself as a guardian." },
        { status: 400 }
      );
    }

    const receiverUser = await prisma.user.findFirst({
      where: {
        phone: receiverPhone,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    const existingGuardian = await prisma.guardianContact.findFirst({
      where: {
        userId: user.id,
        phone: receiverPhone,
      },
    });

    if (existingGuardian) {
      return NextResponse.json(
        { error: "This person is already in your Guardian Circle." },
        { status: 409 }
      );
    }

    const existingInvitation =
      await prisma.guardianInvitation.findFirst({
        where: {
          senderId: user.id,
          receiverPhone,
          status: "PENDING",
        },
      });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "A pending invitation has already been sent." },
        { status: 409 }
      );
    }

    const invitation = await prisma.guardianInvitation.create({
      data: {
        senderId: user.id,
        receiverId: receiverUser?.id ?? null,
        receiverPhone,
        receiverName:
          receiverName || receiverUser?.name || "Guardian",
        relation,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (receiverUser) {
      await prisma.notification.create({
        data: {
          userId: receiverUser.id,
          title: "Guardian Invitation",
          message: `${
            user.name || user.phone
          } invited you to join their Guardian Network.`,
          channel: "GUARDIAN",
        },
      });
    }

    return NextResponse.json(
      {
        message: receiverUser
          ? "Guardian invitation sent successfully."
          : "Invitation saved. The guardian will be linked when they register.",
        invitation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST guardian invitation error:", error);

    return NextResponse.json(
      { error: "Unable to send guardian invitation." },
      { status: 500 }
    );
  }
}