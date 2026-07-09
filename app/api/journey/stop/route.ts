import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = await req.json();
    const journeyId = String(body.journeyId || "");

    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required." },
        { status: 400 }
      );
    }

    const journey = await prisma.safeJourney.update({
      where: {
        id: journeyId,
        userId: user.id,
      },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        timeline: {
          create: {
            message: "Safe Journey completed.",
          },
        },
      },
      include: {
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error("Stop journey error:", error);
    return NextResponse.json(
      { error: "Failed to stop journey." },
      { status: 500 }
    );
  }
}