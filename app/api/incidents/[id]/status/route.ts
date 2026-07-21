import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  IncidentService,
  IncidentServiceError,
} from "@/lib/services/IncidentService";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  req: Request,
  { params }: Params
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
    const body = await req.json();

    const status =
      typeof body.status === "string"
        ? body.status
        : "";

    if (
      status !== "RESPONDING" &&
      status !== "RESOLVED"
    ) {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 }
      );
    }

    const incident = await IncidentService.changeStatus(
      id,
      status
    );

    return NextResponse.json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error(
      "Update incident status error:",
      error
    );

    if (error instanceof IncidentServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to update incident status." },
      { status: 500 }
    );
  }
}