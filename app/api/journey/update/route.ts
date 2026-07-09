import { NextResponse } from "next/server";
import { JourneyTracker } from "@/lib/journey/JourneyTracker";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await JourneyTracker.update(
      body.journeyId,
      body.latitude,
      body.longitude
    );

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to update journey.",
      },
      {
        status: 500,
      }
    );
  }
}