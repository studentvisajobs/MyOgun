import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const phone = String(body.phone || "").trim();
    const code = String(body.code || "").trim();
    const name = String(body.name || "").trim();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 }
      );
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        name: name || undefined,
      },
      create: {
        phone,
        name: name || null,
      },
    });

    const cookieStore = await cookies();

    cookieStore.set("myogun_user_id", user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}