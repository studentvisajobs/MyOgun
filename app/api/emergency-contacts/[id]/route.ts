import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid contact details." },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;

  const name =
    typeof input.name === "string" ? input.name.trim() : "";

  const phone =
    typeof input.phone === "string" ? input.phone.trim() : "";

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone number are required." },
      { status: 400 }
    );
  }

  const result = await prisma.emergencyContact.updateMany({
    where: {
      id,
      userId: user.id,
    },
    data: {
      name,
      phone,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Contact not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Emergency contact updated.",
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const result = await prisma.emergencyContact.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Contact not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Emergency contact deleted.",
  });
}