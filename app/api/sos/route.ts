import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body.userId || "");
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const message = String(body.message || "Emergency SOS Alert");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const sos = await prisma.sOSAlert.create({
      data: {
        userId,
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        message,
      },
    });

    const contacts = await prisma.guardianContact.findMany({
      where: { userId },
    });

    console.log("DEV SOS ALERT:", {
      message,
      latitude,
      longitude,
      contacts: contacts.map((contact) => ({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
      })),
    });

    return NextResponse.json({
      success: true,
      sos,
      contactsNotified: contacts.length,
      devMode: true,
    });
  } catch (error) {
    console.error("SOS error:", error);

    return NextResponse.json(
      { error: "Failed to send SOS alert." },
      { status: 500 }
    );
  }
}