"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddGuardianForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanRelation = relation.trim();

    if (!cleanName || !cleanPhone) {
      setMessage("Name and phone number are required.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch("/api/guardian-circle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || null,
          relation: cleanRelation || null,
          isPrimary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add guardian.");
      }

      setMessage("Guardian added successfully.");

      router.push("/guardian-circle");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while adding the guardian."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-emerald-500/20 bg-[#101010] p-6"
    >
      <div>
        <label
          htmlFor="guardian-name"
          className="text-sm font-bold text-white/80"
        >
          Full name
        </label>

        <input
          id="guardian-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Guardian's full name"
          autoComplete="name"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-500"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="guardian-phone"
          className="text-sm font-bold text-white/80"
        >
          Phone number
        </label>

        <input
          id="guardian-phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+44 7000 000000"
          autoComplete="tel"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-500"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="guardian-email"
          className="text-sm font-bold text-white/80"
        >
          Email address
          <span className="ml-2 font-normal text-white/40">Optional</span>
        </label>

        <input
          id="guardian-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="guardian@example.com"
          autoComplete="email"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-500"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="guardian-relation"
          className="text-sm font-bold text-white/80"
        >
          Relationship
          <span className="ml-2 font-normal text-white/40">Optional</span>
        </label>

        <select
          id="guardian-relation"
          value={relation}
          onChange={(event) => setRelation(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition focus:border-emerald-500"
        >
          <option value="">Select relationship</option>
          <option value="Spouse">Spouse</option>
          <option value="Partner">Partner</option>
          <option value="Parent">Parent</option>
          <option value="Child">Child</option>
          <option value="Sibling">Sibling</option>
          <option value="Friend">Friend</option>
          <option value="Colleague">Colleague</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(event) => setIsPrimary(event.target.checked)}
          className="h-5 w-5 accent-emerald-500"
        />

        <div>
          <p className="font-bold">Primary guardian</p>
          <p className="mt-1 text-sm text-white/50">
            Contact this person first during an emergency.
          </p>
        </div>
      </label>

      {message && (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            message.includes("successfully")
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-4 text-base font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Adding Guardian..." : "Add Guardian"}
      </button>

      <button
        type="button"
        onClick={() => router.push("/guardian-circle")}
        className="mt-3 w-full rounded-full border border-white/10 px-6 py-4 font-bold text-white/65 transition hover:bg-white/5"
      >
        Cancel
      </button>
    </form>
  );
}