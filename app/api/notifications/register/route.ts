import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RegisterPushTokenBody = {
  token?: unknown;
  platform?: unknown;
};

const SUPPORTED_PLATFORMS = new Set([
  "WEB",
  "ANDROID",
  "IOS",
]);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const body =
      (await req.json()) as RegisterPushTokenBody;

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const platform =
      typeof body.platform === "string"
        ? body.platform.trim().toUpperCase()
        : "WEB";

    if (!token) {
      return NextResponse.json(
        { error: "Push token is required." },
        { status: 400 }
      );
    }

    if (!SUPPORTED_PLATFORMS.has(platform)) {
      return NextResponse.json(
        {
          error:
            "Platform must be WEB, ANDROID, or IOS.",
        },
        { status: 400 }
      );
    }

    const pushToken = await prisma.pushToken.upsert({
      where: {
        token,
      },
      update: {
        userId: user.id,
        platform,
      },
      create: {
        userId: user.id,
        token,
        platform,
      },
    });

    return NextResponse.json(
      {
        success: true,
        pushToken: {
          id: pushToken.id,
          platform: pushToken.platform,
          updatedAt: pushToken.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Push token registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to register this device for push notifications.",
      },
      { status: 500 }
    );
  }
}