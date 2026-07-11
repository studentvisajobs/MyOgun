"use client";

import Link from "next/link";
import type { Incident, Evidence, Confirmation } from "@/app/generated/prisma/client";

type IncidentWithData = Incident & {
  evidence: Evidence[];
  confirmations: Confirmation[];
};

function markerPosition(index: number) {
  const positions = [
    { left: "20%", top: "30%" },
    { left: "62%", top: "22%" },
    { left: "45%", top: "50%" },
    { left: "72%", top: "66%" },
    { left: "30%", top: "72%" },
    { left: "82%", top: "38%" },
    { left: "12%", top: "58%" },
    { left: "52%", top: "80%" },
  ];

  return positions[index % positions.length];
}

function markerStyle(status: string, confidence: number) {
  if (status === "CRITICAL" || confidence >= 80) {
    return "bg-red-500 shadow-red-500/40";
  }

  if (status === "VERIFIED" || confidence >= 60) {
    return "bg-yellow-500 shadow-yellow-500/40";
  }

  return "bg-emerald-500 shadow-emerald-500/40";
}

export default function ThreatMapClient({
  incidents,
}: {
  incidents: IncidentWithData[];
}) {
  const critical = incidents.filter(
    (item) => item.status === "CRITICAL" || item.confidenceScore >= 80
  );

  const verified = incidents.filter(
    (item) => item.status === "VERIFIED" || item.confidenceScore >= 60
  );

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 pb-32 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black tracking-[0.3em] text-emerald-400">
              MYOGUN OS
            </p>
            <h1 className="mt-3 text-4xl font-black md:text-5xl">
              🌍 Threat Map
            </h1>
            <p className="mt-3 text-white/60">
              Live community intelligence and nearby risk awareness.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-black hover:border-emerald-500"
          >
            Home
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm text-white/50">Critical</p>
            <p className="mt-2 text-4xl font-black text-red-400">
              {critical.length}
            </p>
          </div>

          <div className="rounded-[2rem] border border-yellow-500/20 bg-yellow-500/10 p-5">
            <p className="text-sm text-white/50">Verified</p>
            <p className="mt-2 text-4xl font-black text-yellow-300">
              {verified.length}
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm text-white/50">Total</p>
            <p className="mt-2 text-4xl font-black text-emerald-400">
              {incidents.length}
            </p>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-2xl font-black">Live Incident Map</h2>
            <p className="mt-1 text-sm text-white/50">
              Red = critical, yellow = verified, green = pending.
            </p>
          </div>

          <div className="relative h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(239,68,68,0.16),_transparent_35%)]">
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>

            {incidents.map((incident, index) => {
              const pos = markerPosition(index);

              return (
                <Link
                  key={incident.id}
                  href={`/incidents/${incident.id}`}
                  className={`absolute flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-black shadow-2xl transition hover:scale-125 ${markerStyle(
                    incident.status,
                    incident.confidenceScore
                  )}`}
                  style={pos}
                  title={incident.title}
                >
                  !
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black">Nearby Reports</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {incidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="rounded-[2rem] border border-white/10 bg-[#111] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-emerald-400">
                      {incident.type.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-xl font-black">
                      {incident.title}
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      📍{" "}
                      {incident.area ||
                        incident.localGovernment ||
                        "Location pending"}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">
                    {incident.status}
                  </span>
                </div>

                <div className="mt-4 flex gap-2 text-xs text-white/50">
                  <span>{incident.confidenceScore}% confidence</span>
                  <span>•</span>
                  <span>{incident.evidence.length} evidence</span>
                  <span>•</span>
                  <span>
                    {
                      incident.confirmations.filter(
                        (item) => item.vote === "CONFIRM"
                      ).length
                    }{" "}
                    witnesses
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}