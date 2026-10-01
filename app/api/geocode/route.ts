import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: NextRequest) {
  try {
    const query =
      request.nextUrl.searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        {
          error: "A location search is required.",
        },
        { status: 400 }
      );
    }

    if (query.length > 200) {
      return NextResponse.json(
        {
          error: "Location search is too long.",
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "5",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "MyOgun Safety Platform/1.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Nominatim geocoding failed:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error:
            "Location search is temporarily unavailable.",
        },
        { status: 502 }
      );
    }

    const results =
      (await response.json()) as NominatimResult[];

    const locations = results
      .map((result) => ({
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        displayName: result.display_name,
      }))
      .filter(
        (result) =>
          Number.isFinite(result.latitude) &&
          Number.isFinite(result.longitude)
      );

    return NextResponse.json({
      locations,
    });
  } catch (error) {
    console.error(
      "Geocoding error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to search for that location.",
      },
      { status: 500 }
    );
  }
}