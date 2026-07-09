"use client";

import { useState } from "react";

export default function ConfirmButtons({
  incidentId,
}: {
  incidentId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function vote(isPositive: boolean) {
    try {
      setLoading(true);

      await fetch(`/api/incidents/${incidentId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPositive,
        }),
      });

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to submit vote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        disabled={loading}
        onClick={() => vote(true)}
        className="rounded-full bg-emerald-500 px-6 py-3 font-bold text-black disabled:opacity-50"
      >
        {loading ? "Submitting..." : "✓ I Witnessed This"}
      </button>

      <button
        disabled={loading}
        onClick={() => vote(false)}
        className="rounded-full bg-red-500 px-6 py-3 font-bold text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "✗ False Report"}
      </button>
    </div>
  );
}