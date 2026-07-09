import { prisma } from "@/lib/prisma";

type EvidenceInput = {
  sessionId?: string | null;
  type: "PHOTO" | "VIDEO" | "AUDIO" | "LOCATION" | "NOTE";
  mode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

export class EvidenceService {
  static async create(data: EvidenceInput) {
    return prisma.emergencyEvidence.create({
      data: {
        sessionId: data.sessionId,
        type: data.type,
        mode: data.mode,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        batteryLevel: data.batteryLevel,
        networkStatus: data.networkStatus,
      },
    });
  }
}