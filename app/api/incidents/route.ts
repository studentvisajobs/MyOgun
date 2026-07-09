export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { detectArea } from "@/lib/ogunAreas";
import { getCurrentUser } from "@/lib/auth";

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return 0;
  return Number(value);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let body: any = {};

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();

      body = {
        userId: formData.get("userId"),
        title: formData.get("title"),
        description: formData.get("description"),
        type: formData.get("type"),
        latitude: formData.get("latitude"),
        longitude: formData.get("longitude"),
        area: formData.get("area"),
        localGovernment: formData.get("localGovernment"),
        isCritical: formData.get("isCritical") === "true",
        isAnonymous: formData.get("isAnonymous") === "true",
      };
    }

    const currentUser = await getCurrentUser();

    const userId = body.userId || currentUser?.id || null;
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const type = String(body.type || "OTHER").trim();

    const latitude = toNumber(body.latitude);
    const longitude = toNumber(body.longitude);

    const isCritical = Boolean(body.isCritical);
    const isAnonymous = Boolean(body.isAnonymous);

    if (!title || !type) {
      return Response.json(
        { error: "Title and type are required." },
        { status: 400 }
      );
    }

    let validUserId: string | undefined = undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: String(userId) },
      });

      if (user) {
        validUserId = user.id;
      }
    }

    const areaInfo =
      latitude && longitude
        ? detectArea(latitude, longitude)
        : {
            area: body.area || null,
            localGovernment: body.localGovernment || null,
          };

    const incident = await prisma.incident.create({
      data: {
        userId: isAnonymous ? undefined : validUserId,
        title,
        description: description || null,
        type: type as any,
        latitude,
        longitude,
        area: body.area || areaInfo.area || null,
        localGovernment: body.localGovernment || areaInfo.localGovernment || null,
        confidenceScore: isCritical ? 70 : 20,
        status: isCritical ? "CRITICAL" : "PENDING",
        isAnonymous,
      },
      include: {
        evidence: true,
        confirmations: true,
        user: true,
      },
    });

    return Response.json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error("Incident error:", error);

    return Response.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const incidents = await prisma.incident.findMany({
    include: {
      evidence: true,
      confirmations: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json({
    success: true,
    incidents,
  });
}