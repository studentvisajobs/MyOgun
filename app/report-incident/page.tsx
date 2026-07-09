"use client";

import { useState } from "react";

export default function ReportIncidentPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("ROBBERY");
  const [evidenceType, setEvidenceType] = useState("PHOTO");
  const [file, setFile] = useState<File | null>(null);
  const [isCritical, setIsCritical] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    if (!title) {
      setStatus("Please enter incident title.");
      return;
    }

    setStatus("Getting location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("Submitting report...");

        const formData = new FormData();

        formData.append("title", title);
        formData.append("description", description);
        formData.append("type", type);
        formData.append("latitude", String(position.coords.latitude));
        formData.append("longitude", String(position.coords.longitude));
        formData.append("isCritical", String(isCritical));
        formData.append("isAnonymous", String(isAnonymous));

        if (file) {
          formData.append("file", file);
          formData.append("evidenceType", evidenceType);
        }

        const response = await fetch("/api/incidents", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus(data.error || "Failed to report incident.");
          return;
        }

        setStatus("Incident reported successfully.");

        setTitle("");
        setDescription("");
        setType("ROBBERY");
        setEvidenceType("PHOTO");
        setFile(null);
        setIsCritical(false);
        setIsAnonymous(false);
      },
      () => {
        setStatus("Location access denied.");
      }
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="font-bold text-emerald-400">
          ← Home
        </a>

        <h1 className="mt-8 text-4xl font-black">Report Security Incident</h1>

        <p className="mt-2 text-white/60">
          Report incidents with GPS location and optional photo, video, or audio
          evidence.
        </p>

        <div className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <label className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <input
              type="checkbox"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
            />

            <span className="font-bold text-red-300">
              Critical incident / urgent danger
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-1"
            />

            <span>
              <span className="block font-bold text-white">
                Report anonymously
              </span>

              <span className="mt-1 block text-sm text-white/50">
                Your name will be hidden from the public. Police/Admin may still
                see your identity for safety verification.
              </span>
            </span>
          </label>

          <div>
            <label className="font-bold">Incident Title</label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Robbery at Ota Junction"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
            />
          </div>

          <div>
            <label className="font-bold">Incident Type</label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
            >
              <option value="ROBBERY">Robbery</option>
              <option value="KIDNAPPING">Kidnapping</option>
              <option value="ACCIDENT">Accident</option>
              <option value="FIRE">Fire</option>
              <option value="FLOOD">Flood</option>
              <option value="MISSING_PERSON">Missing Person</option>
              <option value="SUSPICIOUS_ACTIVITY">
                Suspicious Activity
              </option>
              <option value="ROAD_BLOCK">Road Block</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="font-bold">Description</label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black p-5">
            <h2 className="font-bold">Attach Evidence</h2>

            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
            >
              <option value="PHOTO">Photo</option>
              <option value="VIDEO">Video</option>
              <option value="AUDIO">Voice Note / Audio</option>
            </select>

            <input
              type="file"
              accept={
                evidenceType === "PHOTO"
                  ? "image/*"
                  : evidenceType === "VIDEO"
                    ? "video/*"
                    : "audio/*"
              }
              capture={
                evidenceType === "PHOTO" || evidenceType === "VIDEO"
                  ? "environment"
                  : undefined
              }
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
            />

            <p className="mt-3 text-sm text-white/50">
              For video files, choose Video above. For images, choose Photo.
            </p>
          </div>

          {status && (
            <div className="rounded-xl border border-white/10 bg-black p-4">
              {status}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full rounded-full bg-red-500 px-6 py-4 font-black text-white"
          >
            Submit Incident Report
          </button>
        </div>
      </div>
    </main>
  );
}