"use client";

import { useState } from "react";
import type { GuardianNetworkItem } from "./GuardianStatusCard";

type Props = {
  guardian: GuardianNetworkItem;
  onSaved: () => void;
  onCancel: () => void;
};

export default function EditGuardianForm({
  guardian,
  onSaved,
  onCancel,
}: Props) {
  const [name, setName] = useState(guardian.name);
  const [email, setEmail] = useState(guardian.email ?? "");
  const [relation, setRelation] = useState(guardian.relation ?? "");
  const [isPrimary, setIsPrimary] = useState(guardian.isPrimary);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveGuardian(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/guardian-circle/${encodeURIComponent(guardian.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            name,
            email,
            relation,
            isPrimary,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update guardian.");
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update guardian."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={saveGuardian}
      className="mt-4 space-y-4 rounded-2xl border border-emerald-500/30 bg-black/40 p-4"
    >
      <h4 className="font-black text-emerald-300">
        Edit Guardian
      </h4>

      <label className="block text-sm text-white/70">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          className="mt-2 w-full rounded-xl border border-white/20 bg-[#111] p-3 text-white"
        />
      </label>

      <label className="block text-sm text-white/70">
        Phone number (cannot be changed here)
        <input
          value={guardian.phone}
          readOnly
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white/50"
        />
      </label>

      <label className="block text-sm text-white/70">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/20 bg-[#111] p-3 text-white"
        />
      </label>

      <label className="block text-sm text-white/70">
        Relationship
        <input
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Family, Friend, Neighbour..."
          className="mt-2 w-full rounded-xl border border-white/20 bg-[#111] p-3 text-white"
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="h-5 w-5 accent-emerald-500"
        />
        Primary Guardian
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-black disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}