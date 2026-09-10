import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const contacts =
      await prisma.guardianContact.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return NextResponse.json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error(
      "Fetch offline guardian contacts error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch guardian contacts.",
      },
      { status: 500 }
    );
  }
}