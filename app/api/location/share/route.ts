import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = await req.json();

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const accuracy = body.accuracy ? Number(body.accuracy) : null;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const location = await prisma.sharedLocation.upsert({
    where: { userId: user.id },
    update: {
      latitude,
      longitude,
      accuracy,
      status: "ONLINE",
    },
    create: {
      userId: user.id,
      latitude,
      longitude,
      accuracy,
      status: "ONLINE",
    },
  });

  return NextResponse.json({ success: true, location });
}