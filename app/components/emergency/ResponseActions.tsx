"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  incidentId: string;
};

export default function ResponseActions({ incidentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function updateStatus(status: string) {
    setLoading(status);

    const res = await fetch("/api/response/incident-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ incidentId, status }),
    });

    setLoading("");

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to update status.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <button
        onClick={() => updateStatus("RESPONDING")}
        disabled={!!loading}
        className="rounded-full bg-blue-500 py-3 text-sm font-black text-white disabled:opacity-40"
      >
        {loading === "RESPONDING" ? "Updating..." : "Respond"}
      </button>

      <button
        onClick={() => updateStatus("RESOLVED")}
        disabled={!!loading}
        className="rounded-full bg-emerald-500 py-3 text-sm font-black text-black disabled:opacity-40"
      >
        {loading === "RESOLVED" ? "Updating..." : "Resolve"}
      </button>
    </div>
  );
}