"use client";

import { useState } from "react";

export default function UploadEvidenceButton({
  incidentId,
}: {
  incidentId: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("PHOTO");
  const [status, setStatus] = useState("");

  async function uploadEvidence() {
    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    setStatus("Uploading evidence...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch(`/api/incidents/${incidentId}/evidence`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Evidence upload failed.");
      return;
    }

    setStatus("Evidence uploaded successfully.");
    window.location.reload();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <h3 className="font-bold">Upload Evidence</h3>

      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white"
      >
        <option value="PHOTO">Photo</option>
        <option value="VIDEO">Video</option>
        <option value="AUDIO">Voice Note / Audio</option>
      </select>

      <input
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={(event) =>
          setFile(event.target.files ? event.target.files[0] : null)
        }
        className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
      />

      {status && <p className="mt-3 text-sm text-white/60">{status}</p>}

      <button
        type="button"
        onClick={uploadEvidence}
        className="mt-4 w-full rounded-full bg-red-500 px-5 py-3 font-bold text-white"
      >
        Upload Evidence
      </button>
    </div>
  );
}