"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL = 60_000;

export default function PresenceHeartbeat() {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const sendHeartbeat = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch (error) {
        console.warn("Presence heartbeat failed:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    };

    void sendHeartbeat();

    intervalId = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  return null;
}