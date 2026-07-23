import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  _request: Request,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const result =
      await prisma.notification.updateMany({
        where: {
          id,
          userId: user.id,
        },
        data: {
          isRead: true,
        },
      });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    const notification =
      await prisma.notification.findFirst({
        where: {
          id,
          userId: user.id,
        },
      });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "Unable to mark notification as read:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to mark notification as read.",
      },
      { status: 500 }
    );
  }
}