import { NextRequest, NextResponse } from "next/server";

type NominatimReverseResult = {
  display_name?: string;
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    const latitude = Number(
      request.nextUrl.searchParams.get("lat")
    );

    const longitude = Number(
      request.nextUrl.searchParams.get("lon")
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Valid coordinates are required." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      zoom: "18",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "MyOgun Safety Platform/1.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Address lookup is temporarily unavailable." },
        { status: 502 }
      );
    }

    const result =
      (await response.json()) as NominatimReverseResult;

    const address = result.address ?? {};

    const locality =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      address.neighbourhood ||
      null;

    const region =
      address.county ||
      address.state_district ||
      address.state ||
      null;

    const shortName = [locality, region]
      .filter(
        (value, index, values) =>
          value && values.indexOf(value) === index
      )
      .join(", ");

    return NextResponse.json({
      shortName:
        shortName ||
        result.display_name ||
        "Location unavailable",
      displayName:
        result.display_name ||
        shortName ||
        "Location unavailable",
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    return NextResponse.json(
      { error: "Unable to identify this location." },
      { status: 500 }
    );
  }
}