import { addEvidenceToQueue } from "./EvidenceQueue";
import type { EvidenceMetadata } from "./EvidenceTypes";

export class EvidenceEngine {
  async createEvidence(metadata: EvidenceMetadata) {
    const res = await fetch("/api/evidence/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    const data = await res.json();

    if (!res.ok) {
      addEvidenceToQueue(metadata);
      throw new Error(data.error || "Failed to create evidence.");
    }

    return data;
  }

  queueEvidence(metadata: EvidenceMetadata) {
    addEvidenceToQueue(metadata);
  }
}