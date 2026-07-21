export const runtime = "nodejs";

import { getCurrentUser } from "@/lib/auth";
import {
  IncidentService,
  IncidentServiceError,
} from "@/lib/services/IncidentService";

function toNumber(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return Number.NaN;
  }

  return Number(value);
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

export async function POST(request: Request) {
  try {
    const contentType =
      request.headers.get("content-type") || "";

    let body: Record<string, unknown>;

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

    const incident = await IncidentService.create({
      userId:
        (typeof body.userId === "string"
          ? body.userId
          : null) ||
        currentUser?.id ||
        null,

      title:
        typeof body.title === "string"
          ? body.title
          : "",

      description:
        typeof body.description === "string"
          ? body.description
          : null,

      type:
        typeof body.type === "string"
          ? body.type
          : "OTHER",

      latitude: toNumber(body.latitude),

      longitude: toNumber(body.longitude),

      area:
        typeof body.area === "string"
          ? body.area
          : null,

      localGovernment:
        typeof body.localGovernment === "string"
          ? body.localGovernment
          : null,

      isCritical: toBoolean(body.isCritical),

      isAnonymous: toBoolean(body.isAnonymous),
    });

    return Response.json(
      {
        success: true,
        incident,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Incident POST error:", error);

    if (error instanceof IncidentServiceError) {
      return Response.json(
        {
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    return Response.json(
      {
        error: "Failed to create incident.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const incidents =
      await IncidentService.getAll();

    return Response.json({
      success: true,
      incidents,
    });
  } catch (error) {
    console.error("Incident GET error:", error);

    return Response.json(
      {
        error: "Failed to load incidents.",
      },
      {
        status: 500,
      }
    );
  }
}