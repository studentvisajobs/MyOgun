import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  IncidentService,
  IncidentServiceError,
} from "@/lib/services/IncidentService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const incidentId =
      typeof body.incidentId === "string"
        ? body.incidentId
        : "";

    const vote =
      typeof body.vote === "string"
        ? body.vote
        : "";

    const comment =
      typeof body.comment === "string"
        ? body.comment
        : null;

    if (
      vote !== "CONFIRM" &&
      vote !== "FALSE_REPORT"
    ) {
      return NextResponse.json(
        { error: "Invalid vote." },
        { status: 400 }
      );
    }

    const result = await IncidentService.confirm(
      incidentId,
      user.id,
      vote,
      comment
    );

    return NextResponse.json({
      success: true,
      incident: result.incident,
      confirmCount: result.confirmCount,
      falseReportCount: result.falseReportCount,
    });
  } catch (error) {
    console.error(
      "Confirm incident error:",
      error
    );

    if (error instanceof IncidentServiceError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to verify incident.",
      },
      {
        status: 500,
      }
    );
  }
}