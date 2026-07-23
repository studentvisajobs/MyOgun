import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/lib/services/NotificationService";

export async function PATCH() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const result =
      await NotificationService.markAllAsRead(
        user.id
      );

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error(
      "Unable to mark notifications as read:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to mark notifications as read.",
      },
      { status: 500 }
    );
  }
}