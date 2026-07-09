import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

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

    return NextResponse.json({ responders: session.responders });
  } catch (error) {
    console.error("Guardian responders error:", error);

    return NextResponse.json(
      { error: "Failed to fetch responders." },
      { status: 500 }
    );
  }
}