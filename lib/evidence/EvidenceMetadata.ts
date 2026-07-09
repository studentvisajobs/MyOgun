import type { EvidenceMetadata } from "./EvidenceTypes";

export function buildEvidenceMetadata(data: EvidenceMetadata): EvidenceMetadata {
  return {
    sessionId: data.sessionId ?? null,
    mode: data.mode ?? null,
    type: data.type,
    fileUrl: data.fileUrl ?? null,
    publicId: data.publicId ?? null,
    fileName: data.fileName ?? null,
    mimeType: data.mimeType ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    accuracy: data.accuracy ?? null,
    batteryLevel: data.batteryLevel ?? null,
    networkStatus: data.networkStatus ?? null,
  };
}