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
      body.latitude === undefined || body.latitude === null
        ? null
        : Number(body.latitude);

    const longitude =
      body.longitude === undefined || body.longitude === null
        ? null
        : Number(body.longitude);

    const alert = await prisma.sOSAlert.create({
      data: {
        userId: user.id,
        latitude,
        longitude,
        message: "Guardian Mode activated",
        status: "ACTIVE",
        timeline: {
          create: {
            message: "Guardian session created.",
            latitude,
            longitude,
          },
        },
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Guardian session POST error:", error);

    return NextResponse.json(
      { error: "Failed to create Guardian session." },
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
    const message = String(body.message || "Location updated.");

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required." },
        { status: 400 }
      );
    }

    const latitude =
      body.latitude === undefined || body.latitude === null
        ? null
        : Number(body.latitude);

    const longitude =
      body.longitude === undefined || body.longitude === null
        ? null
        : Number(body.longitude);

    const alert = await prisma.sOSAlert.update({
      where: {
        id: alertId,
        userId: user.id,
      },
      data: {
        latitude,
        longitude,
        timeline: {
          create: {
            message,
            latitude,
            longitude,
          },
        },
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Guardian session PATCH error:", error);

    return NextResponse.json(
      { error: "Failed to update Guardian session." },
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
        userId: user.id,
      },
      data: {
        status: "RESOLVED",
        timeline: {
          create: {
            message: "Guardian session stopped safely.",
          },
        },
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Guardian session DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to stop Guardian session." },
      { status: 500 }
    );
  }
}