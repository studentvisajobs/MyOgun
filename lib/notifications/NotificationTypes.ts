export type NotificationChannel =
  | "guardian"
  | "community"
  | "police"
  | "emergency";

export interface NotificationPayload {
  title: string;
  message: string;

  channel: NotificationChannel;

  userId?: string;

  incidentId?: string;

  journeyId?: string;

  emergencyId?: string;

  data?: Record<string, unknown>;
}