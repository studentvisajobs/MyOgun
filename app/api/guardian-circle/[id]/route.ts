import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianService,
  GuardianServiceError,
} from "@/lib/services/GuardianService";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: Request,
  context: Context
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.name !== "string" ||
      typeof body.isPrimary !== "boolean" ||
      (body.email != null && typeof body.email !== "string") ||
      (body.relation != null && typeof body.relation !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid guardian details." },
        { status: 400 }
      );
    }

    const guardian = await GuardianService.updateGuardian({
      userId: user.id,
      guardianId: id,
      name: body.name,
      email: body.email ?? null,
      relation: body.relation ?? null,
      isPrimary: body.isPrimary,
    });

    return NextResponse.json({
      success: true,
      guardian,
    });
  } catch (error) {
    console.error("Edit Guardian error:", error);

    if (error instanceof GuardianServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to update guardian." },
      { status: 500 }
    );
  }
}
export async function DELETE(
  _req: Request,
  context: Context
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Guardian ID is required." },
        { status: 400 }
      );
    }

    await GuardianService.removeGuardian({
      userId: user.id,
      guardianId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Guardian removed successfully.",
    });
  } catch (error) {
    console.error("Delete Guardian error:", error);

    if (error instanceof GuardianServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete guardian." },
      { status: 500 }
    );
  }
}