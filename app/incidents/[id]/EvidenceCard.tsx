import type { Evidence } from "@/app/generated/prisma";

export default function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const isPhoto = evidence.type === "PHOTO";
  const isVideo = evidence.type === "VIDEO";
  const isAudio = evidence.type === "AUDIO";

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-sm font-black text-emerald-400">{evidence.type}</p>
          <p className="mt-1 text-xs text-white/50">
            Uploaded {evidence.createdAt.toLocaleString()}
          </p>
        </div>

        <a
          href={evidence.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-black"
        >
          Open
        </a>
      </div>

      <div className="p-5">
        {isPhoto && (
          <img
            src={evidence.fileUrl}
            alt="Incident evidence"
            className="max-h-[420px] w-full rounded-2xl object-cover"
          />
        )}

        {isVideo && (
          <video
            src={evidence.fileUrl}
            controls
            className="w-full rounded-2xl"
          />
        )}

        {isAudio && (
          <audio
            src={evidence.fileUrl}
            controls
            className="w-full"
          />
        )}

        {!isPhoto && !isVideo && !isAudio && (
          <p className="text-white/60">Unsupported evidence type.</p>
        )}
      </div>
    </div>
  );
}