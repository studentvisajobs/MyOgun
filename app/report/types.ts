export type ReportStep =
  | "TYPE"
  | "DETAILS"
  | "EVIDENCE"
  | "LOCATION"
  | "REVIEW"
  | "SUCCESS";

export type UploadedEvidence = {
  fileUrl: string;
  publicId: string;
  fileName: string;
  mimeType: string;
};

export type ReportData = {
  type: string;
  title: string;
  description: string;
  isAnonymous: boolean;
  evidenceNote: string;
  evidenceFiles: UploadedEvidence[];
  latitude: number | null;
  longitude: number | null;
  area: string;
  localGovernment: string;
  submittedIncidentId: string | null;
};