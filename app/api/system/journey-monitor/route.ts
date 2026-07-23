import { NextResponse } from "next/server";
import { JourneyMonitor } from "@/lib/services/JourneyMonitor";

export async function POST() {
  try {
    const result = await JourneyMonitor.run();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Journey monitor failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Journey monitor failed.",
      },
      {
        status: 500,
      }
    );
  }
}