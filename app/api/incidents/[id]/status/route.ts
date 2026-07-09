import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { status } = body;

    const allowedStatuses = ["RESPONDING", "RESOLVED"];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error("Update incident status error:", error);

    return NextResponse.json(
      { error: "Failed to update incident status" },
      { status: 500 }
    );
  }
}