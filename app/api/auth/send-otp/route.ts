import { sendOtpSMS } from "@/lib/twilio";
import { hashOtp } from "@/lib/otp-security";
import { checkOtpRateLimit } from "@/lib/otp-rate-limit";
import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";

import { hashRateLimitIp } from "@/lib/otp-ip-security";
import { prisma } from "@/lib/prisma";

function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body.phone || "").trim();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid international phone number, e.g. +2348012345678." },
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
      ? `otp:ip:${hashRateLimitIp(clientIp)}`
      : "otp:ip:local-development";

    const ipAllowed = await checkOtpRateLimit(
      ipKey,
      10,
      15 * 60 * 1000
    );

    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many verification requests. Please try again later." },
        { status: 429 }
      );
    }

    const allowed = await checkOtpRateLimit(
      `otp:phone:${phone}`,
      5,
      15 * 60 * 1000
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many verification requests. Please try again later." },
        { status: 429 }
      );
    }

    const code = generateOtp();

    const created = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${phone}, 0)
        )
      `;
      const recentOtp = await tx.otpCode.findFirst({
        where: {
          phone,
          createdAt: {
            gt: new Date(Date.now() - 60 * 1000),
          },
        },
        select: { id: true },
      });

      if (recentOtp) {
        return false;
      }

      await tx.otpCode.updateMany({
        where: {
          phone,
          used: false,
        },
        data: {
          used: true,
        },
      });

      const newOtp = await tx.otpCode.create({
        data: {
          phone,
          code: hashOtp(phone, code),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      return newOtp.id;
    });

    if (!created) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting another code." },
        { status: 429 }
      );
    }

    try {
      await sendOtpSMS(phone, code);
    } catch (error: unknown) {
      const twilioCode =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "UNKNOWN";

      console.error("MyOgun OTP SMS delivery failed", {
        provider: "Twilio",
        errorCode: twilioCode,
      });

      return NextResponse.json(
        {
          error: "Unable to send verification code. Please try again later.",
        },
        { status: 502 }
      );
    }

    // OTP codes must never be written to server logs.

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Verification codes are delivered by SMS only.
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}