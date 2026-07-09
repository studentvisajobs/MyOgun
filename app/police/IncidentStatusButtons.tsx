"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function IncidentStatusButtons({
  incidentId,
}: {
  incidentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(status: "RESPONDING" | "RESOLVED") {
    setLoading(status);

    await fetch(`/api/incidents/${incidentId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    setLoading(null);
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <button
        onClick={() => updateStatus("RESPONDING")}
        disabled={loading !== null}
        className="rounded-full bg-yellow-400 px-4 py-2 font-bold text-black disabled:opacity-50"
      >
        🚔 {loading === "RESPONDING" ? "Updating..." : "Responding"}
      </button>

      <button
        onClick={() => updateStatus("RESOLVED")}
        disabled={loading !== null}
        className="rounded-full bg-blue-500 px-4 py-2 font-bold text-white disabled:opacity-50"
      >
        ✅ {loading === "RESOLVED" ? "Updating..." : "Resolved"}
      </button>
    </div>
  );
}