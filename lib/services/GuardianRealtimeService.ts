type DashboardCallback<T> = (
  dashboard: T
) => void;

export class GuardianRealtimeService {
  static subscribe<T>(
    sessionId: string,
    loader: (id: string) => Promise<T>,
    callback: DashboardCallback<T>,
    interval = 5000
  ) {
    let cancelled = false;

    const refresh = async () => {
      if (cancelled) {
        return;
      }

      try {
        const dashboard =
          await loader(sessionId);

        if (!cancelled) {
          callback(dashboard);
        }
      } catch {
        // Ignore transient network errors.
      }
    };

    void refresh();

    const timer = window.setInterval(
      refresh,
      interval
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }
}