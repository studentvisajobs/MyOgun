import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned || null;
}

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

    const preferredArea = cleanText(
      body.preferredArea
    );

    const preferredLocalGovernment =
      cleanText(
        body.preferredLocalGovernment
      );

    if (
      !preferredArea &&
      !preferredLocalGovernment
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter at least one preferred location.",
        },
        { status: 400 }
      );
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          preferredArea,
          preferredLocalGovernment,
        },
        select: {
          id: true,
          preferredArea: true,
          preferredLocalGovernment: true,
        },
      });

    return NextResponse.json({
      success: true,
      preferences: {
        preferredArea:
          updatedUser.preferredArea,
        preferredLocalGovernment:
          updatedUser.preferredLocalGovernment,
      },
    });
  } catch (error) {
    console.error(
      "Preferred location update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to save preferred location.",
      },
      { status: 500 }
    );
  }
}