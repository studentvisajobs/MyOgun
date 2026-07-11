import Link from "next/link";
import type { GuardianContact } from "@/app/generated/prisma/client";

export default function GuardianSummary({
  guardians,
}: {
  guardians: GuardianContact[];
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">👥 Guardian Circle</h2>
        <Link
          href="/guardian-circle"
          className="text-sm font-bold text-emerald-400"
        >
          Manage
        </Link>
      </div>

      <div className="mt-4 rounded-[2rem] border border-white/10 bg-[#111] p-5">
        {guardians.length === 0 ? (
          <p className="text-white/60">No guardians added yet.</p>
        ) : (
          <div className="space-y-3">
            {guardians.map((guardian) => (
              <div
                key={guardian.id}
                className="flex items-center justify-between rounded-2xl bg-black/30 p-4"
              >
                <div>
                  <p className="font-black">{guardian.name}</p>
                  <p className="text-sm text-white/50">
                    {guardian.relation || "Trusted contact"}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                  READY
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}