export type EvidenceCaptureType = "PHOTO" | "VIDEO" | "AUDIO" | "LOCATION" | "NOTE";

export type EvidenceStatus = "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";

export type EvidenceMetadata = {
  sessionId?: string | null;
  mode?: string | null;
  type: EvidenceCaptureType;
  fileUrl?: string | null;
  publicId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};