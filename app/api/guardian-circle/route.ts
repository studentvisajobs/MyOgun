import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const guardians = await prisma.guardianContact.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ guardians });
  } catch (error) {
    console.error("Guardian Circle GET error:", error);

    return NextResponse.json(
      { error: "Failed to load guardians." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : null;
    const relation =
      typeof body.relation === "string" && body.relation.trim()
        ? body.relation.trim()
        : null;
    const isPrimary = Boolean(body.isPrimary);

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required." },
        { status: 400 }
      );
    }

    const existingGuardian = await prisma.guardianContact.findFirst({
      where: {
        userId: user.id,
        phone,
      },
    });

    if (existingGuardian) {
      return NextResponse.json(
        { error: "A guardian with this phone number already exists." },
        { status: 409 }
      );
    }

    if (isPrimary) {
      await prisma.guardianContact.updateMany({
        where: {
          userId: user.id,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const guardian = await prisma.guardianContact.create({
      data: {
        userId: user.id,
        name,
        phone,
        email,
        relation,
        isPrimary,
      },
    });

    return NextResponse.json(
      {
        success: true,
        guardian,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Guardian Circle POST error:", error);

    return NextResponse.json(
      { error: "Failed to add guardian." },
      { status: 500 }
    );
  }
}