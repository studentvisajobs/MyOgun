import type { Evidence } from "@/app/generated/prisma/client";
import EvidenceCard from "./EvidenceCard";

export default function EvidenceGallery({ evidence }: { evidence: Evidence[] }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Evidence</h2>

        <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/60">
          {evidence.length} file{evidence.length === 1 ? "" : "s"}
        </span>
      </div>

      {evidence.length === 0 ? (
        <div className="mt-4 rounded-[2rem] border border-white/10 bg-[#111] p-6 text-white/60">
          No evidence has been uploaded for this incident yet.
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {evidence.map((item) => (
            <EvidenceCard key={item.id} evidence={item} />
          ))}
        </div>
      )}
    </section>
  );
}
