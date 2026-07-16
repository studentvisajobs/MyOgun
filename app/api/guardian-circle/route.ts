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

    const guardians = await GuardianService.getContacts(user.id);

    return NextResponse.json({ guardians });
  } catch (error) {
    console.error("Guardian Circle GET error:", error);

    return NextResponse.json(
      { error: "Failed to load guardians." },
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

    const guardian = await GuardianService.addGuardian({
      userId: user.id,
      name:
        typeof body.name === "string"
          ? body.name
          : "",
      phone:
        typeof body.phone === "string"
          ? body.phone
          : "",
      email:
        typeof body.email === "string"
          ? body.email
          : null,
      relation:
        typeof body.relation === "string"
          ? body.relation
          : null,
      isPrimary: Boolean(body.isPrimary),
    });

    return NextResponse.json(
      {
        success: true,
        guardian,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Guardian Circle POST error:", error);

    if (error instanceof GuardianServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to add guardian." },
      { status: 500 }
    );
  }
}