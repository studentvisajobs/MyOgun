import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const body = await req.json();

    const receiverName = String(body.receiverName || "").trim();
    const receiverPhone = String(body.receiverPhone || "").trim();
    const relation = String(body.relation || "").trim();

    if (!receiverPhone) {
      return NextResponse.json(
        { error: "Guardian phone number is required." },
        { status: 400 }
      );
    }

    const invitation = await prisma.guardianInvitation.create({
      data: {
        senderId: user.id,
        receiverName: receiverName || null,
        receiverPhone,
        relation: relation || null,
        status: "PENDING",
      },
    });

    await prisma.guardianContact.create({
      data: {
        userId: user.id,
        name: receiverName || "Guardian",
        phone: receiverPhone,
        relation: relation || null,
        isPrimary: false,
      },
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Guardian invite error:", error);
    return NextResponse.json(
      { error: "Failed to invite guardian." },
      { status: 500 }
    );
  }
}