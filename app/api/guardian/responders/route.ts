import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";

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
    const sessionId = searchParams.get("sessionId")?.trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const session = await prisma.guardianSession.findFirst({
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
    console.error("Fetch guardian responders error:", error);

    return NextResponse.json(
      { error: "Failed to fetch responders." },
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

    const body = await req.json().catch(() => null);

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

    const session = await prisma.guardianSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      select: {
        id: true,
        status: true,
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
        { error: "Guardian session is not active." },
        { status: 400 }
      );
    }

    const responders =
      await GuardianSessionService.assignResponders(session.id);

    return NextResponse.json({
      success: true,
      message:
        responders.length > 0
          ? "Guardian responders assigned."
          : "No guardian responders are available.",
      responders,
    });
  } catch (error) {
    console.error("Assign guardian responders error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to assign guardian responders." },
      { status: 500 }
    );
  }
}