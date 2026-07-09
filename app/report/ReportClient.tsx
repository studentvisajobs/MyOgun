"use client";

import { useState } from "react";
import type { ReportData, ReportStep } from "./types";
import ProgressBar from "./components/ProgressBar";
import IncidentTypeStep from "./components/IncidentTypeStep";
import IncidentDetailsStep from "./components/IncidentDetailsStep";
import EvidenceStep from "./components/EvidenceStep";
import LocationStep from "./components/LocationStep";
import ReviewStep from "./components/ReviewStep";
import SuccessStep from "./components/SuccessStep";

const initialData: ReportData = {
  type: "",
  title: "",
  description: "",
  isAnonymous: false,
  evidenceNote: "",
  latitude: null,
  longitude: null,
  area: "",
  localGovernment: "",
  submittedIncidentId: null,
  evidenceFiles: [],
};

export default function ReportClient() {
  const [step, setStep] = useState<ReportStep>("TYPE");
  const [data, setData] = useState<ReportData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateData(partial: Partial<ReportData>) {
    setData((old) => ({
      ...old,
      ...partial,
    }));
  }

  async function submitReport() {
    setLoading(true);
    setError("");

    try {
      if (data.latitude === null || data.longitude === null) {
        throw new Error("Location is required before submitting this report.");
      }

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: `${data.description}${
            data.evidenceNote ? `\n\nEvidence note: ${data.evidenceNote}` : ""
          }`,
          type: data.type,
          latitude: data.latitude,
          longitude: data.longitude,
          area: data.area,
          localGovernment: data.localGovernment,
          isAnonymous: data.isAnonymous,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit report.");
      }

      const incidentId = result.incident?.id || result.id || null;

      if (incidentId) {
        for (const file of data.evidenceFiles) {
          await fetch("/api/incidents/evidence", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              incidentId,
              fileUrl: file.fileUrl,
              mimeType: file.mimeType,
            }),
          });
        }
      }

      updateData({
        submittedIncidentId: incidentId,
      });

      setStep("SUCCESS");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="rounded-[2rem] border border-emerald-500/20 bg-[#111] p-6">
        <h2 className="text-2xl font-black">Report & Protect</h2>

        <p className="mt-2 text-sm text-white/60">
          Add details, location and evidence in one guided flow.
        </p>

        <ProgressBar step={step} />
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {step === "TYPE" && (
        <IncidentTypeStep
          selected={data.type}
          onSelect={(type) => updateData({ type })}
          onNext={() => setStep("DETAILS")}
        />
      )}

      {step === "DETAILS" && (
        <IncidentDetailsStep
          title={data.title}
          description={data.description}
          isAnonymous={data.isAnonymous}
          area={data.area}
          localGovernment={data.localGovernment}
          setTitle={(title) => updateData({ title })}
          setDescription={(description) => updateData({ description })}
          setIsAnonymous={(isAnonymous) => updateData({ isAnonymous })}
          setArea={(area) => updateData({ area })}
          setLocalGovernment={(localGovernment) =>
            updateData({ localGovernment })
          }
          onBack={() => setStep("TYPE")}
          onNext={() => setStep("EVIDENCE")}
        />
      )}

      {step === "EVIDENCE" && (
        <EvidenceStep
          evidenceNote={data.evidenceNote}
          evidenceFiles={data.evidenceFiles}
          setEvidenceNote={(evidenceNote) => updateData({ evidenceNote })}
          setEvidenceFiles={(evidenceFiles) => updateData({ evidenceFiles })}
          onBack={() => setStep("DETAILS")}
          onNext={() => setStep("LOCATION")}
        />
      )}

      {step === "LOCATION" && (
        <LocationStep
          latitude={data.latitude}
          longitude={data.longitude}
          setLatitude={(latitude) => updateData({ latitude })}
          setLongitude={(longitude) => updateData({ longitude })}
          onBack={() => setStep("EVIDENCE")}
          onNext={() => setStep("REVIEW")}
        />
      )}

      {step === "REVIEW" && (
        <ReviewStep
          data={data}
          loading={loading}
          onBack={() => setStep("LOCATION")}
          onSubmit={submitReport}
        />
      )}

      {step === "SUCCESS" && (
        <SuccessStep incidentId={data.submittedIncidentId} />
      )}
    </>
  );
}