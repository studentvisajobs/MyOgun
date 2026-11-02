
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { JourneyMonitor } from "@/lib/services/JourneyMonitor";

export async function POST(request: Request) {
  const secret = process.env.JOURNEY_MONITOR_SECRET;

  // Fail closed if the monitoring secret is not configured.
  if (!secret) {
    console.error("Journey monitor secret is not configured.");

    return NextResponse.json(
      { error: "Monitoring unavailable." },
      { status: 503 }
    );
  }

  const authorization = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;

  const receivedBuffer = Buffer.from(authorization ?? "");
  const expectedBuffer = Buffer.from(expected);

  const authorized =
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!authorized) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const result = await JourneyMonitor.run();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Journey monitor failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Journey monitor failed.",
      },
      { status: 500 }
    );
  }
}
