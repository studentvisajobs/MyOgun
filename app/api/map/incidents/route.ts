import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        status: {
          not: "RESOLVED",
        },
      },
      select: {
        id: true,
        type: true,
        status: true,
        threatLevel: true,
        threatScore: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to load incidents.",
      },
      {
        status: 500,
      }
    );
  }
}