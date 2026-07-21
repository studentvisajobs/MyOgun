export class GuardianDashboardService {
  static async getSession(sessionId: string) {
    const response = await fetch(
      "/api/guardian/session/" + sessionId,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(
        json.error ??
          "Unable to load Guardian Dashboard."
      );
    }

    return json.dashboard;
  }

  static async refresh(sessionId: string) {
    return this.getSession(sessionId);
  }

  static async getTimeline(sessionId: string) {
    const dashboard =
      await this.getSession(sessionId);

    return dashboard.timeline;
  }

  static async getEvidence(sessionId: string) {
    const dashboard =
      await this.getSession(sessionId);

    return dashboard.evidence;
  }

  static async getResponders(sessionId: string) {
    const dashboard =
      await this.getSession(sessionId);

    return dashboard.responders;
  }
}