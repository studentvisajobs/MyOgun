import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const incidentId = String(body.incidentId || "");
    const status = String(body.status || "");

    if (!incidentId || !status) {
      return NextResponse.json(
        { error: "Incident ID and status are required." },
        { status: 400 }
      );
    }

    if (!["RESPONDING", "RESOLVED", "CRITICAL", "VERIFIED", "FALSE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: status as any,
        updates: {
          create: {
            message: `Response Centre changed status to ${status}.`,
          },
        },
      },
      include: {
        evidence: true,
        confirmations: true,
        updates: true,
      },
    });

    return NextResponse.json({ success: true, incident });
  } catch (error) {
    console.error("Response status error:", error);
    return NextResponse.json(
      { error: "Failed to update incident status." },
      { status: 500 }
    );
  }
}