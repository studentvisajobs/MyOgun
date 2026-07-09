import { prisma } from "@/lib/prisma";

export default async function LatestIncidentVideo() {
  const latestVideo = await prisma.evidence.findFirst({
    where: {
      type: "VIDEO",
    },
    include: {
      incident: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestVideo) {
    return (
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-red-500 via-orange-500 to-emerald-400">
        <div className="px-6 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-black/70">
            Community Intelligence Network
          </p>
          <h2 className="text-4xl font-black text-black md:text-6xl">
            Report. Verify. Protect.
          </h2>
        </div>
      </div>
    );
  }

  const incidentTitle = latestVideo.incident?.title ?? "Untitled Incident";
  const incidentStatus = latestVideo.incident?.status ?? "PENDING";
  const confidence = latestVideo.incident?.confidenceScore ?? 0;

  return (
    <div className="bg-black">
      <video
        src={latestVideo.fileUrl}
        controls
        className="aspect-video w-full bg-black object-cover"
      />

      <div className="border-t border-white/10 bg-black p-4">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">
          Latest Incident Video
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          {incidentTitle}
        </h2>

        <p className="mt-1 text-sm text-white/50">
          {incidentStatus} • {confidence}% confidence
        </p>
      </div>
    </div>
  );
}