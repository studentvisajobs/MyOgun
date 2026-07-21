"use client";

import GuardianHeader from "./GuardianHeader";
import GuardianStats from "./GuardianStats";
import GuardianIntelligenceCard from "./GuardianIntelligenceCard";
import LiveMap from "./LiveMap";
import RespondersPanel, {
  type GuardianResponder,
} from "./RespondersPanel";
import TimelinePanel from "./TimelinePanel";
import EvidencePanel, {
  type EmergencyEvidence,
} from "./EvidencePanel";

export type GuardianDashboardData = {
  session: {
    id: string;
    status: string;
    startedAt: string;
    batteryLevel?: number | null;
    networkStatus?: string | null;

    user?: {
      name?: string | null;
      phone?: string | null;
    } | null;
  };

  summary: {
    responderCount: number;
    evidenceCount: number;
    acknowledgementCount: number;
    isActive: boolean;
    hasLocation?: boolean;
  };

  latestLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    createdAt: string;
  } | null;

  responders: GuardianResponder[];

  evidence: EmergencyEvidence[];

  timeline: Array<{
    id: string;
    message: string;
    createdAt: string;
  }>;
};

type Props = {
  dashboard: GuardianDashboardData;
};

export default function GuardianDashboard({
  dashboard,
}: Props) {
  return (
    <main className="min-h-screen space-y-6 bg-black p-6 text-white">
      <GuardianHeader
        name={dashboard.session.user?.name}
        status={dashboard.session.status}
        batteryLevel={dashboard.session.batteryLevel}
        networkStatus={dashboard.session.networkStatus}
      />

      <GuardianStats
        responderCount={
          dashboard.summary.responderCount
        }
        evidenceCount={
          dashboard.summary.evidenceCount
        }
        acknowledgementCount={
          dashboard.summary
            .acknowledgementCount
        }
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <LiveMap
          location={dashboard.latestLocation}
        />

        <RespondersPanel
        sessionId={dashboard.session.id}
        responders={dashboard.responders}
        />
      </section>

      <GuardianIntelligenceCard
        dashboard={{
          session: dashboard.session,
          summary: dashboard.summary,
          latestLocation:
            dashboard.latestLocation,
        }}
      />

      <TimelinePanel
        timeline={dashboard.timeline}
      />

      <EvidencePanel
        evidence={dashboard.evidence}
      />
    </main>
  );
}
