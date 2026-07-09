"use client";

import { useState } from "react";

type Props = {
  incidentId: string;
  initialConfidence: number;
  initialStatus: string;
  initialConfirmCount: number;
  initialFalseReportCount: number;
};

export default function CommunityVerificationPanel({
  incidentId,
  initialConfidence,
  initialStatus,
  initialConfirmCount,
  initialFalseReportCount,
}: Props) {
  const [confidence, setConfidence] = useState(initialConfidence);
  const [status, setStatus] = useState(initialStatus);
  const [confirmCount, setConfirmCount] = useState(initialConfirmCount);
  const [falseReportCount, setFalseReportCount] = useState(
    initialFalseReportCount
  );
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function vote(type: "CONFIRM" | "FALSE_REPORT") {
    setLoading(true);

    const res = await fetch("/api/incidents/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incidentId,
        vote: type,
        comment,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Unable to submit verification.");
      setLoading(false);
      return;
    }

    setConfidence(data.incident.confidenceScore);
    setStatus(data.incident.status);
    setConfirmCount(data.confirmCount);
    setFalseReportCount(data.falseReportCount);
    setLoading(false);
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
            COMMUNITY VERIFICATION
          </p>
          <h2 className="mt-2 text-2xl font-black">Help verify this report</h2>
        </div>

        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/60">
          {status}
        </span>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
        <p className="text-sm text-white/50">Confidence Score</p>
        <p className="mt-2 text-4xl font-black text-emerald-400">
          {confidence}%
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-2xl font-black text-emerald-300">
            {confirmCount}
          </p>
          <p className="mt-1 text-sm text-white/60">Confirmations</p>
        </div>

        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-2xl font-black text-red-300">
            {falseReportCount}
          </p>
          <p className="mt-1 text-sm text-white/60">False Votes</p>
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment as a witness..."
        rows={3}
        className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none focus:border-emerald-500"
      />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <button
          disabled={loading}
          onClick={() => vote("CONFIRM")}
          className="rounded-full bg-emerald-500 py-4 font-black text-black disabled:opacity-40"
        >
          👍 Confirm
        </button>

        <button
          disabled={loading}
          onClick={() => vote("FALSE_REPORT")}
          className="rounded-full bg-red-500 py-4 font-black text-white disabled:opacity-40"
        >
          👎 False Report
        </button>
      </div>
    </section>
  );
}