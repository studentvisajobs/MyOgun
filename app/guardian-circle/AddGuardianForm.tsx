"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type MessageType = "success" | "error" | null;

export default function AddGuardianForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanRelation = relation.trim();

    if (!cleanName || !cleanPhone) {
      setMessage("Name and phone number are required.");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType(null);

      const response = await fetch("/api/guardian-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverName: cleanName,
          receiverPhone: cleanPhone,
          relation: cleanRelation || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send guardian invitation."
        );
      }

      setMessage(
        data.message || "Guardian invitation sent successfully."
      );
      setMessageType("success");

      setName("");
      setPhone("");
      setRelation("");

      setTimeout(() => {
        router.push("/guardian-circle");
        router.refresh();
      }, 1000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while sending the invitation."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-emerald-500/20 bg-[#101010] p-6"
    >
      <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <p className="font-bold text-emerald-300">
          Invite a trusted guardian
        </p>

        <p className="mt-1 text-sm leading-6 text-white/55">
          They will need to accept your invitation before joining your
          Guardian Network.
        </p>
      </div>

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
          disabled={submitting}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          disabled={submitting}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mt-2 text-xs leading-5 text-white/40">
          Use the same phone number they use, or will use, for their
          MyOgun account.
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="guardian-relation"
          className="text-sm font-bold text-white/80"
        >
          Relationship
          <span className="ml-2 font-normal text-white/40">
            Optional
          </span>
        </label>

        <select
          id="guardian-relation"
          value={relation}
          onChange={(event) => setRelation(event.target.value)}
          disabled={submitting}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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

      {message && (
        <div
          role="alert"
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            messageType === "success"
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
        {submitting ? "Sending Invitation..." : "Send Guardian Invitation"}
      </button>

      <button
        type="button"
        onClick={() => router.push("/guardian-circle")}
        disabled={submitting}
        className="mt-3 w-full rounded-full border border-white/10 px-6 py-4 font-bold text-white/65 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>
    </form>
  );
}