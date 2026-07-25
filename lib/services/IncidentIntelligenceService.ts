import { CommunityNotificationService } from "@/lib/services/CommunityNotificationService";
import { ThreatScoreService } from "@/lib/services/ThreatScoreService";

export class IncidentIntelligenceService {
  static calculateThreat(params: {
    type: string;
    confidenceScore: number;
    confirmations: number;
    evidenceCount: number;
    isCritical: boolean;
  }) {
    return ThreatScoreService.calculate(params);
  }

  static async notifyNearbyUsers(params: {
    reporterUserId: string;
    incidentId: string;
    latitude: number;
    longitude: number;
    title: string;
    message: string;
    radiusMetres?: number;
  }) {
    return CommunityNotificationService.notifyNearbyUsers(
      params
    );
  }
}