import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is disabled. Use the authorised guardian session response API.",
    },
    { status: 410 }
  );
}