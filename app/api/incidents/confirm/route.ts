import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CommunityVerification } from "@/lib/community/CommunityVerification";

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

    const incidentId = String(body.incidentId || "");
    const vote = body.vote as "CONFIRM" | "FALSE_REPORT";
    const comment = String(body.comment || "").trim();

    if (!incidentId) {
      return NextResponse.json(
        { error: "Incident ID is required." },
        { status: 400 }
      );
    }

    if (!["CONFIRM", "FALSE_REPORT"].includes(vote)) {
      return NextResponse.json(
        { error: "Invalid vote." },
        { status: 400 }
      );
    }

    // Look for an existing vote from this user
    const existingVote = await prisma.confirmation.findFirst({
      where: {
        incidentId,
        userId: user.id,
      },
    });

    if (existingVote) {
      // Update existing vote
      await prisma.confirmation.update({
        where: {
          id: existingVote.id,
        },
        data: {
          vote,
          comment: comment || null,
        },
      });
    } else {
      // Create new vote
      await prisma.confirmation.create({
        data: {
          incidentId,
          userId: user.id,
          vote,
          comment: comment || null,
        },
      });
    }

    // Recalculate confidence score
    const incident = await CommunityVerification.recalculate(incidentId);

    const confirmations = await prisma.confirmation.findMany({
      where: {
        incidentId,
      },
    });

    const confirmCount = confirmations.filter(
      (item) => item.vote === "CONFIRM"
    ).length;

    const falseReportCount = confirmations.filter(
      (item) => item.vote === "FALSE_REPORT"
    ).length;

    return NextResponse.json({
      success: true,
      incident,
      confirmCount,
      falseReportCount,
    });
  } catch (error) {
    console.error("Confirm incident error:", error);

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