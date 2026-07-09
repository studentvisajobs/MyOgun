import type { UploadedEvidence } from "../types";

type Props = {
  evidenceNote: string;
  evidenceFiles: UploadedEvidence[];
  setEvidenceNote: (value: string) => void;
  setEvidenceFiles: (files: UploadedEvidence[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function EvidenceStep({
  evidenceNote,
  evidenceFiles,
  setEvidenceNote,
  setEvidenceFiles,
  onNext,
  onBack,
}: Props) {
  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/evidence/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Upload failed.");
      return;
    }

    setEvidenceFiles([...evidenceFiles, data]);
  }

  return (
    <section className="mt-8">
      <h1 className="text-4xl font-black">Add Evidence</h1>
      <p className="mt-3 text-white/60">
        Add photo, video, audio, or any file that supports this report.
      </p>

      <label className="mt-6 block rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6">
        <p className="text-4xl">📷</p>
        <h2 className="mt-4 text-2xl font-black">Upload Evidence</h2>
        <p className="mt-2 text-sm text-white/60">
          Photo, video, audio, or file.
        </p>

        <input
          type="file"
          accept="image/*,video/*,audio/*"
          className="mt-4 block w-full text-sm text-white/60"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
      </label>

      {evidenceFiles.length > 0 && (
        <div className="mt-5 space-y-3">
          {evidenceFiles.map((file, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-[#111] p-4"
            >
              <p className="font-bold">{file.fileName}</p>
              <p className="mt-1 text-xs text-white/50">{file.mimeType}</p>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={evidenceNote}
        onChange={(e) => setEvidenceNote(e.target.value)}
        placeholder="Optional evidence note"
        rows={4}
        className="mt-5 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-4 text-white outline-none focus:border-emerald-500"
      />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 py-4 font-black text-white"
        >
          Back
        </button>

        <button
          onClick={onNext}
          className="rounded-full bg-emerald-500 py-4 font-black text-black"
        >
          Continue
        </button>
      </div>
    </section>
  );
}