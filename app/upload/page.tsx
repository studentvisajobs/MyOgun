"use client";

import { useState } from "react";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("Abeokuta TV");
  const [category, setCategory] = useState("Community");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function handleUpload() {
    if (!title || !file) {
      setStatus("Please add a title and choose a video file.");
      return;
    }

    setStatus("Uploading video... please wait.");

    const formData = new FormData();
    formData.append("file", file);

    formData.append("title", title);
    formData.append("description", description);
    formData.append("channel", channel);
    formData.append("category", category);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Upload failed.");
        return;
      }

      console.log("Uploaded video:", data.result);

      setStatus("Video uploaded successfully.");

      setTitle("");
      setDescription("");
      setChannel("Abeokuta TV");
      setCategory("Community");
      setFile(null);
    } catch (error) {
      console.error(error);
      setStatus(
        "Upload failed. Please check your internet, video size, or Cloudinary settings."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-bold text-emerald-400">
          ← Back to Home
        </a>

        <h1 className="mt-8 text-4xl font-black">Upload Video</h1>
        <p className="mt-2 text-white/60">
          Share videos, events, culture, business stories, and community updates
          with Ogun people worldwide.
        </p>

        <div className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div>
            <label className="text-sm font-bold">Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Abeokuta Festival Highlights"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-sm font-bold">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell people what this video is about..."
              rows={5}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-sm font-bold">Community Channel</label>
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option>Abeokuta TV</option>
              <option>Ijebu TV</option>
              <option>Ota TV</option>
              <option>Sagamu TV</option>
              <option>Remo TV</option>
              <option>Yewa TV</option>
              <option>Ogun Diaspora TV</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-emerald-400"
            >
              <option>Community</option>
              <option>Culture</option>
              <option>Event</option>
              <option>Business</option>
              <option>Diaspora</option>
              <option>Security</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold">Video File</label>
            <div className="mt-2 rounded-2xl border border-dashed border-white/20 bg-black p-6">
              <input
                type="file"
                accept="video/*"
                onChange={(event) =>
                  setFile(event.target.files ? event.target.files[0] : null)
                }
              />
              <p className="mt-3 text-sm text-white/50">
                Choose a video from your computer.
              </p>
            </div>
          </div>

          {status && (
            <p className="rounded-2xl border border-white/10 bg-black p-4 text-sm text-white/70">
              {status}
            </p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            className="w-full rounded-full bg-emerald-500 px-6 py-4 font-black text-black"
          >
            Publish Video
          </button>
        </div>
      </div>
    </main>
  );
}