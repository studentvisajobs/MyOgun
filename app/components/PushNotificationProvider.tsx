
"use client";

import { useEffect } from "react";
import { getToken } from "@firebase/messaging";
import { messaging } from "@/lib/firebase/client";

export default function PushNotificationProvider() {
  useEffect(() => {
    async function registerPush() {
      try {
        if (
          !messaging ||
          !("serviceWorker" in navigator) ||
          !("Notification" in window)
        ) {
          return;
        }

        const permission =
          await Notification.requestPermission();

        if (permission !== "granted") {
          return;
        }

        const registration =
          await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );

        const token = await getToken(messaging, {
          vapidKey:
            process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          console.error(
            "Firebase did not return a push token."
          );
          return;
        }

        const response = await fetch(
          "/api/notifications/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
              platform: "WEB",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to register push token."
          );
        }

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

    void registerPush();
  }, []);

  return null;
}
