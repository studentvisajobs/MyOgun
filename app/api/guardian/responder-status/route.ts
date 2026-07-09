import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const responderId = String(body.responderId || "");
    const status = String(body.status || "");

    if (!responderId) {
      return NextResponse.json(
        { error: "Responder ID is required." },
        { status: 400 }
      );
    }

    if (!["VIEWED", "RESPONDING", "ARRIVED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid responder status." },
        { status: 400 }
      );
    }

    const now = new Date();

    const responder = await prisma.emergencyResponder.update({
      where: {
        id: responderId,
      },
      data: {
        status: status as "VIEWED" | "RESPONDING" | "ARRIVED" | "COMPLETED",
        viewedAt: status === "VIEWED" ? now : undefined,
        respondingAt: status === "RESPONDING" ? now : undefined,
        arrivedAt: status === "ARRIVED" ? now : undefined,
        completedAt: status === "COMPLETED" ? now : undefined,
      },
    });

    return NextResponse.json({ responder });
  } catch (error) {
    console.error("Responder status error:", error);

    return NextResponse.json(
      { error: "Failed to update responder status." },
      { status: 500 }
    );
  }
}