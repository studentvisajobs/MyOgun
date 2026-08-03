"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase/client";

export default function PushNotificationProvider() {
  useEffect(() => {
    async function registerPush() {
      try {
        if (!messaging) {
          return;
        }

        const permission =
          await Notification.requestPermission();

        if (permission !== "granted") {
          return;
        }

        const token = await getToken(messaging, {
          vapidKey:
            process.env
              .NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (!token) {
          return;
        }

        await fetch("/api/notifications/register", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token,
            platform: "WEB",
          }),
        });

        console.log(
          "Push token registered successfully."
        );
      } catch (error) {
        console.error(
          "Push registration failed:",
          error
        );
      }
    }

    registerPush();
  }, []);

  return null;
}
