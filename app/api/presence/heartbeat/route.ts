import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastActiveAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      lastActiveAt: now.toISOString(),
    });
  } catch (error) {
    console.error(
      "Presence heartbeat failed:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 }
    );
  }
}