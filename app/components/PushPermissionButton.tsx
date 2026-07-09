"use client";

import { useState } from "react";

export default function PushPermissionButton() {
  const [status, setStatus] = useState("");

  async function enableAlerts() {
    if (!("Notification" in window)) {
      setStatus("Notifications are not supported on this device.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setStatus("Danger alerts enabled.");
      new Notification("MyOgun Alerts Enabled", {
        body: "You will receive danger warnings when alerts are nearby.",
      });
    } else {
      setStatus("Notifications were not enabled.");
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={enableAlerts}
        className="rounded-full border border-orange-400 px-5 py-2 text-sm font-bold text-orange-300"
      >
        Enable Danger Notifications
      </button>

      {status && <p className="mt-2 text-xs text-white/50">{status}</p>}
    </div>
  );
}