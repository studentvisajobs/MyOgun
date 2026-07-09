import type { EvidenceMetadata } from "./EvidenceTypes";

const STORAGE_KEY = "myogun_evidence_queue";

export function getEvidenceQueue(): EvidenceMetadata[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEvidenceQueue(items: EvidenceMetadata[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addEvidenceToQueue(item: EvidenceMetadata) {
  const items = getEvidenceQueue();
  items.unshift(item);
  saveEvidenceQueue(items);
}

export function clearEvidenceQueue() {
  saveEvidenceQueue([]);
}