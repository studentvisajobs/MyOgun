export type EmergencyMode = "GUARDIAN" | "SOS" | "SAFE_JOURNEY" | "AI_MONITOR";

export type EmergencyStatus =
  | "READY"
  | "STARTING"
  | "ACTIVE"
  | "STOPPING"
  | "STOPPED"
  | "ERROR";

export type EmergencyLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type EmergencyTimelineItem = {
  time: string;
  message: string;
};

export type EmergencyEngineOptions = {
  mode: EmergencyMode;
  onStatus: (status: EmergencyStatus) => void;
  onTimeline: (item: EmergencyTimelineItem) => void;
  onLocation: (location: EmergencyLocation) => void;
  onBattery: (battery: number | null) => void;
  onSession: (sessionId: string | null) => void;
  onStartedAt?: (startedAt: string | null) => void;
};