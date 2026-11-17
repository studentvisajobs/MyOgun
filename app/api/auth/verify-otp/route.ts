import { createSessionToken } from "@/lib/session";
import { checkOtpRateLimit } from "@/lib/otp-rate-limit";
import { hashRateLimitIp } from "@/lib/otp-ip-security";
import { verifyOtpHash } from "@/lib/otp-security";
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

    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid international phone number." },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-real-ip");

    if (!clientIp && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Unable to verify request origin." },
        { status: 403 }
      );
    }

    const ipKey = clientIp
      ? `otp:verify:ip:${hashRateLimitIp(clientIp)}`
      : "otp:verify:ip:local-development";

    const ipAllowed = await checkOtpRateLimit(
      ipKey,
      20,
      15 * 60 * 1000
    );

    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many verification requests. Please try again later." },
        { status: 429 }
      );
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    if (otp.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Request a new code." },
        { status: 429 }
      );
    }

    if (!verifyOtpHash(phone, code, otp.code)) {
      await prisma.otpCode.updateMany({
        where: {
          id: otp.id,
          used: false,
          attempts: { lt: 5 },
          expiresAt: { gt: new Date() },
        },
        data: {
          attempts: { increment: 1 },
        },
      });

      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

    const claimedOtp = await prisma.otpCode.updateMany({
      where: {
        id: otp.id,
        used: false,
        attempts: { lt: 5 },
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    if (claimedOtp.count !== 1) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      );
    }

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

    const sessionToken = await createSessionToken(user.id);

    cookieStore.set("myogun_user_id", sessionToken, {
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