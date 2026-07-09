import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const invitations = await prisma.guardianInvitation.findMany({
      where: {
        senderId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Guardian invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations." },
      { status: 500 }
    );
  }
}