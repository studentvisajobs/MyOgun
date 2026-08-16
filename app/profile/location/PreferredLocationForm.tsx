"use client";

import { useState } from "react";

type Props = {
  initialArea: string;
  initialLocalGovernment: string;
};

export default function PreferredLocationForm({
  initialArea,
  initialLocalGovernment,
}: Props) {
  const [area, setArea] = useState(initialArea);
  const [localGovernment, setLocalGovernment] =
    useState(initialLocalGovernment);

  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePreference() {
    try {
      setSaving(true);
      setStatus("Saving preferred location...");

      const response = await fetch(
        "/api/profile/preferred-location",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferredArea: area,
            preferredLocalGovernment:
              localGovernment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save preferred location."
        );
      }

      setStatus(
        "Preferred location saved successfully."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save preferred location."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#111] p-6">
      <div>
        <label className="text-sm font-black text-white/70">
          Preferred Area
        </label>

        <input
          value={area}
          onChange={(event) =>
            setArea(event.target.value)
          }
          placeholder="Example: Abeokuta"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="mt-5">
        <label className="text-sm font-black text-white/70">
          Local Government / City
        </label>

        <input
          value={localGovernment}
          onChange={(event) =>
            setLocalGovernment(
              event.target.value
            )
          }
          placeholder="Example: Abeokuta South"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-emerald-500/50"
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-white/45">
        MyOgun will prioritise safety reports
        and alerts matching this location.
      </p>

      {status && (
        <p className="mt-4 text-sm text-emerald-300">
          {status}
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          void savePreference()
        }
        disabled={saving}
        className="mt-6 w-full rounded-full bg-emerald-500 py-4 font-black text-black disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : "Save Preferred Location"}
      </button>
    </section>
  );
}