import type { EmergencyTimelineItem } from "./EmergencyTypes";

export function createEmergencyTimelineEvent(
  message: string
): EmergencyTimelineItem {
  return {
    time: new Date().toLocaleTimeString(),
    message,
  };
}