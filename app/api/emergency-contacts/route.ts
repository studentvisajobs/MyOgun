import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const contacts = await prisma.emergencyContact.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const phone =
    typeof body.phone === "string" ? body.phone.trim() : "";

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone number are required." },
      { status: 400 }
    );
  }

  const contact = await prisma.emergencyContact.create({
    data: {
      name,
      phone,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return NextResponse.json(
    {
      success: true,
      contact,
    },
    { status: 201 }
  );
}