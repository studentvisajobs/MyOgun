import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianService,
  GuardianServiceError,
} from "@/lib/services/GuardianService";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const invitations =
      await GuardianService.getInvitations(
        user.id,
        user.phone
      );

    return NextResponse.json({
      sent: invitations.sent,
      received: invitations.received,
    });
  } catch (error) {
    console.error(
      "GET guardian invitations error:",
      error
    );

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

    const result =
      await GuardianService.sendInvitation({
        senderId: user.id,
        senderName: user.name,
        senderPhone: user.phone,
        receiverName:
          typeof body.receiverName === "string"
            ? body.receiverName
            : "",
        receiverPhone:
          typeof body.receiverPhone === "string"
            ? body.receiverPhone
            : "",
        relation:
          typeof body.relation === "string"
            ? body.relation
            : null,
      });

    return NextResponse.json(
      {
        message: result.receiverRegistered
          ? "Guardian invitation sent successfully."
          : "Invitation saved. The guardian will be linked when they register.",
        invitation: result.invitation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST guardian invitation error:",
      error
    );

    if (error instanceof GuardianServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Unable to send guardian invitation." },
      { status: 500 }
    );
  }
}