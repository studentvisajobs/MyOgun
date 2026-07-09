import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const latitude =
      body.latitude === undefined ? null : Number(body.latitude);

    const longitude =
      body.longitude === undefined ? null : Number(body.longitude);

    const message = String(body.message || "Guardian Mode activated");

    const alert = await prisma.sOSAlert.create({
      data: {
        userId: user.id,
        latitude,
        longitude,
        message,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Guardian Mode POST error:", error);

    return NextResponse.json(
      { error: "Failed to activate Guardian Mode." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const alertId = String(body.alertId || "");

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required." },
        { status: 400 }
      );
    }

    const alert = await prisma.sOSAlert.update({
      where: {
        id: alertId,
      },
      data: {
        latitude: Number(body.latitude),
        longitude: Number(body.longitude),
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Guardian Mode PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update Guardian Mode." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const alertId = String(body.alertId || "");

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required." },
        { status: 400 }
      );
    }

    const alert = await prisma.sOSAlert.update({
      where: {
        id: alertId,
      },
      data: {
        status: "RESOLVED",
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Guardian Mode DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to stop Guardian Mode." },
      { status: 500 }
    );
  }
}