"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  phone: string;
};

export default function EditProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone);
  const [loading, setLoading] = useState(false);

  async function saveProfile() {
    setLoading(true);

    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to update profile.");
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => router.back()}
          className="font-bold text-emerald-400"
        >
          ← Back
        </button>

        <h1 className="mt-8 text-4xl font-black">Edit Profile</h1>

        <div className="mt-8 space-y-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-white outline-none"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-white outline-none"
          />

          <button
            onClick={saveProfile}
            disabled={loading}
            className="w-full rounded-full bg-emerald-500 py-4 font-black text-black disabled:opacity-40"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}