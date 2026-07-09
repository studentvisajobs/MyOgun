export type GuardianTimelineItem = {
  time: string;
  message: string;
};

export function createTimelineEvent(message: string): GuardianTimelineItem {
  return {
    time: new Date().toLocaleTimeString(),
    message,
  };
}