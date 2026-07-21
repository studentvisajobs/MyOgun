import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
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

    const session = await GuardianSessionService.start({
      userId: user.id,
      latitude: toOptionalNumber(body.latitude),
      longitude: toOptionalNumber(body.longitude),
      batteryLevel: toOptionalNumber(body.batteryLevel),
      networkStatus:
        typeof body.networkStatus === "string"
          ? body.networkStatus
          : null,
    });

    return NextResponse.json({
      alert: session,
      session,
    });
  } catch (error) {
    console.error("Guardian session POST error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to create Guardian session." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : typeof body.alertId === "string"
          ? body.alertId.trim()
          : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const activeSession =
      await GuardianSessionService.getActive(user.id);

    if (!activeSession || activeSession.id !== sessionId) {
      return NextResponse.json(
        { error: "Active Guardian session not found." },
        { status: 404 }
      );
    }

    const session = await GuardianSessionService.update(
      sessionId,
      {
        latitude: toOptionalNumber(body.latitude),
        longitude: toOptionalNumber(body.longitude),
        accuracy: toOptionalNumber(body.accuracy),
        batteryLevel: toOptionalNumber(body.batteryLevel),
        networkStatus:
          typeof body.networkStatus === "string"
            ? body.networkStatus
            : null,
        message:
          typeof body.message === "string" &&
          body.message.trim()
            ? body.message.trim()
            : "Location updated.",
      }
    );

    return NextResponse.json({
      alert: session,
      session,
    });
  } catch (error) {
    console.error("Guardian session PATCH error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to update Guardian session." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : typeof body.alertId === "string"
          ? body.alertId.trim()
          : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const activeSession =
      await GuardianSessionService.getActive(user.id);

    if (!activeSession || activeSession.id !== sessionId) {
      return NextResponse.json(
        { error: "Active Guardian session not found." },
        { status: 404 }
      );
    }

    const session =
      await GuardianSessionService.stop(sessionId);

    return NextResponse.json({
      alert: session,
      session,
    });
  } catch (error) {
    console.error("Guardian session DELETE error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to stop Guardian session." },
      { status: 500 }
    );
  }
}