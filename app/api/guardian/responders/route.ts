import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";
import { NotificationService as PushNotificationService } from "@/lib/notifications/NotificationService";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId =
      searchParams.get("sessionId")?.trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const session =
      await prisma.guardianSession.findFirst({
        where: {
          id: sessionId,
          userId: user.id,
        },
        include: {
          responders: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      responders: session.responders,
    });
  } catch (error) {
    console.error(
      "Fetch guardian responders error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch responders.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const body =
      await req.json().catch(() => null);

    const sessionId =
      typeof body?.sessionId === "string"
        ? body.sessionId.trim()
        : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const session =
      await prisma.guardianSession.findFirst({
        where: {
          id: sessionId,
          userId: user.id,
        },
        select: {
          id: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error:
            "Guardian session is not active.",
        },
        { status: 400 }
      );
    }

    const responders =
      await GuardianSessionService.assignResponders(
        session.id
      );

    /*
     * Match responder phone numbers to
     * registered MyOgun users.
     */
    const responderPhones = Array.from(
      new Set(
        responders
          .map(
            (responder) =>
              responder.guardianPhone
          )
          .filter(
            (phone): phone is string =>
              Boolean(phone)
          )
      )
    );

    let guardianUserIds: string[] = [];

    if (responderPhones.length > 0) {
      const registeredGuardians =
        await prisma.user.findMany({
          where: {
            phone: {
              in: responderPhones,
            },

            // Never send the emergency
            // notification back to the
            // person who activated it.
            id: {
              not: user.id,
            },
          },
          select: {
            id: true,
          },
        });

      guardianUserIds = Array.from(
        new Set(
          registeredGuardians.map(
            (guardian) => guardian.id
          )
        )
      );
    }

    /*
     * Send the emergency push.
     *
     * Push failure must not cause the
     * emergency session itself to fail.
     */
    if (guardianUserIds.length > 0) {
      const locationText =
        session.latitude !== null &&
        session.longitude !== null
          ? `Location: ${session.latitude.toFixed(
              5
            )}, ${session.longitude.toFixed(
              5
            )}.`
          : "Location is currently unavailable.";

      try {
        await PushNotificationService.notifyGuardians(
          guardianUserIds,
          "🚨 MyOgun SOS Emergency",
          `${
            user.name || "A MyOgun user"
          } may be in danger. ${locationText} Open MyOgun immediately.`
        );
      } catch (pushError) {
        console.error(
          "Guardian emergency push error:",
          pushError
        );
      }
    }

    return NextResponse.json({
      success: true,

      message:
        responders.length > 0
          ? "Guardian responders assigned."
          : "No guardian responders are available.",

      responders,

      push: {
        responderCount: responders.length,
        registeredGuardians:
          guardianUserIds.length,
      },
    });
  } catch (error) {
    console.error(
      "Assign guardian responders error:",
      error
    );

    if (
      error instanceof GuardianSessionError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to assign guardian responders.",
      },
      { status: 500 }
    );
  }
}