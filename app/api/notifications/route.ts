import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/lib/services/NotificationService";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Login required.",
        },
        {
          status: 401,
        }
      );
    }

    const [notifications, unreadCount] =
      await Promise.all([
        NotificationService.getForUser(
          user.id
        ),
        NotificationService.unreadCount(
          user.id
        ),
      ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Unable to load notifications:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load notifications.",
      },
      {
        status: 500,
      }
    );
  }
}