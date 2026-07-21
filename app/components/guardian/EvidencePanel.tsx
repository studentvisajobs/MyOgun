"use client";

export type EmergencyEvidence = {
  id: string;
  type?: string | null;
  fileUrl?: string | null;
  url?: string | null;
  secureUrl?: string | null;
  fileName?: string | null;
  title?: string | null;
  description?: string | null;
  mimeType?: string | null;
  createdAt: string;
};

type EvidencePanelProps = {
  evidence: EmergencyEvidence[];
};

type EvidenceKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "unknown";

function getEvidenceUrl(item: EmergencyEvidence) {
  return (
    item.fileUrl ??
    item.secureUrl ??
    item.url ??
    null
  );
}

function getEvidenceKind(
  item: EmergencyEvidence
): EvidenceKind {
  const type = item.type?.toLowerCase() ?? "";
  const mimeType =
    item.mimeType?.toLowerCase() ?? "";
  const url =
    getEvidenceUrl(item)?.toLowerCase() ?? "";

  if (
    type.includes("image") ||
    mimeType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(
      url
    )
  ) {
    return "image";
  }

  if (
    type.includes("video") ||
    mimeType.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)
  ) {
    return "video";
  }

  if (
    type.includes("audio") ||
    mimeType.startsWith("audio/") ||
    /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url)
  ) {
    return "audio";
  }

  if (
    type.includes("document") ||
    type.includes("file") ||
    mimeType.includes("pdf") ||
    /\.(pdf|doc|docx|txt|csv)(\?|$)/i.test(url)
  ) {
    return "document";
  }

  return "unknown";
}

function getEvidenceIcon(kind: EvidenceKind) {
  switch (kind) {
    case "image":
      return "📷";
    case "video":
      return "🎥";
    case "audio":
      return "🎤";
    case "document":
      return "📄";
    default:
      return "📎";
  }
}

function getEvidenceLabel(kind: EvidenceKind) {
  switch (kind) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "document":
      return "Document";
    default:
      return "Evidence";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

function EvidencePreview({
  item,
}: {
  item: EmergencyEvidence;
}) {
  const url = getEvidenceUrl(item);
  const kind = getEvidenceKind(item);

  if (!url) {
    return (
      <div className="flex h-52 items-center justify-center bg-black/40 px-6 text-center">
        <div>
          <div className="text-4xl">
            {getEvidenceIcon(kind)}
          </div>

          <p className="mt-3 text-sm font-semibold text-white">
            File unavailable
          </p>

          <p className="mt-1 text-xs text-white/40">
            No file URL was provided for this evidence.
          </p>
        </div>
      </div>
    );
  }

  if (kind === "image") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block h-52 overflow-hidden bg-black"
      >
        <img
          src={url}
          alt={
            item.title ??
            item.fileName ??
            "Emergency evidence"
          }
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
          loading="lazy"
        />
      </a>
    );
  }

  if (kind === "video") {
    return (
      <div className="flex h-52 items-center bg-black">
        <video
          src={url}
          controls
          preload="metadata"
          className="max-h-52 w-full"
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div className="flex h-52 items-center justify-center bg-black/50 px-6">
        <div className="w-full text-center">
          <div className="text-5xl">🎤</div>

          <p className="mt-3 text-sm font-semibold text-white">
            Audio evidence
          </p>

          <audio
            src={url}
            controls
            preload="metadata"
            className="mt-4 w-full"
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-52 items-center justify-center bg-black/40 px-6 text-center">
      <div>
        <div className="text-5xl">
          {getEvidenceIcon(kind)}
        </div>

        <p className="mt-3 font-semibold text-white">
          {item.fileName ??
            item.title ??
            getEvidenceLabel(kind)}
        </p>

        <p className="mt-1 text-sm text-white/40">
          Open the file to review this evidence.
        </p>
      </div>
    </div>
  );
}

export default function EvidencePanel({
  evidence,
}: EvidencePanelProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Emergency Evidence
          </h2>

          <p className="mt-1 text-sm text-white/50">
            Images, videos, audio and documents captured
            during the Guardian session.
          </p>
        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
          {evidence.length}
        </span>
      </div>

      {evidence.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center px-6 py-12 text-center">
          <div>
            <div className="text-5xl">📁</div>

            <p className="mt-4 font-semibold text-white">
              No evidence captured
            </p>

            <p className="mt-2 max-w-md text-sm text-white/50">
              Photos, videos, audio recordings and uploaded
              documents will appear here when they are
              associated with this Guardian session.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {evidence.map((item) => {
            const url = getEvidenceUrl(item);
            const kind = getEvidenceKind(item);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900"
              >
                <EvidencePreview item={item} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">
                        {item.title ??
                          item.fileName ??
                          `${getEvidenceLabel(
                            kind
                          )} evidence`}
                      </p>

                      <p className="mt-1 text-xs uppercase tracking-wide text-white/40">
                        {getEvidenceLabel(kind)}
                      </p>
                    </div>

                    <span className="text-2xl">
                      {getEvidenceIcon(kind)}
                    </span>
                  </div>

                  {item.description ? (
                    <p className="mt-3 line-clamp-2 text-sm text-white/60">
                      {item.description}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs text-white/40">
                    Captured{" "}
                    {formatDateTime(item.createdAt)}
                  </p>

                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      Open evidence
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-white/5 px-4 py-2 text-sm font-bold text-white/30"
                    >
                      File unavailable
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}