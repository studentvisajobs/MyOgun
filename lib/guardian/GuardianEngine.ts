import { getBatteryLevel } from "./GuardianBattery";
import {
  getCurrentGPS,
  GuardianLocation,
  stopGPSWatch,
  watchGPS,
} from "./GuardianGPS";
import { getNetworkStatus } from "./GuardianNetwork";
import {
  createTimelineEvent,
  GuardianTimelineItem,
} from "./GuardianTimeline";
import {
  startGuardianSession,
  stopGuardianSession,
  updateGuardianSession,
} from "./GuardianSession";

type GuardianEngineOptions = {
  onTimeline: (item: GuardianTimelineItem) => void;
  onLocation: (location: GuardianLocation) => void;
  onStatus: (status: string) => void;
  onBattery: (battery: number | null) => void;
  onSession: (sessionId: string | null) => void;
};

export class GuardianEngine {
  private watchId: number | null = null;
  private sessionId: string | null = null;
  private options: GuardianEngineOptions;

  constructor(options: GuardianEngineOptions) {
    this.options = options;
  }

  private timeline(message: string) {
    this.options.onTimeline(
      createTimelineEvent(message)
    );
  }

  private startLocationWatch() {
    stopGPSWatch(this.watchId);

    this.watchId = watchGPS(
      async (newLocation) => {
        this.options.onLocation(newLocation);

        const currentBattery =
          await getBatteryLevel();

        const currentNetwork =
          getNetworkStatus();

        this.options.onBattery(
          currentBattery
        );

        if (this.sessionId) {
          try {
            await updateGuardianSession(
              this.sessionId,
              "Location updated.",
              newLocation,
              currentBattery,
              currentNetwork
            );
          } catch (error) {
            this.timeline(
              `Location sync failed: ${
                error instanceof Error
                  ? error.message
                  : String(error)
              }`
            );
          }
        }
      },
      (message) => {
        this.timeline(message);
      }
    );
  }

  async start() {
    this.options.onStatus("STARTING");

    this.timeline(
      "Guardian activation started."
    );

    const network =
      getNetworkStatus();

    this.timeline(
      `Network status: ${network}.`
    );

    const battery =
      await getBatteryLevel();

    this.options.onBattery(battery);

    if (battery !== null) {
      this.timeline(
        `Battery level: ${battery}%.`
      );
    }

    try {
      this.timeline(
        "Requesting GPS location."
      );

      const location =
        await getCurrentGPS();

      this.options.onLocation(location);

      this.timeline("GPS locked.");

      const session =
        await startGuardianSession(
          location,
          battery,
          network
        );

      this.sessionId =
        session.session.id;

      this.options.onSession(
        this.sessionId
      );

      this.timeline(
        "Guardian session saved to backend."
      );

      this.startLocationWatch();

      this.timeline(
        "Live tracking started."
      );

      if (this.sessionId) {
        await updateGuardianSession(
          this.sessionId,
          "Guardian Circle ready.",
          location,
          battery,
          network
        );
      }

      this.timeline(
        "Guardian Circle ready."
      );

      this.options.onStatus("ACTIVE");
    } catch (error) {
      this.timeline(
        error instanceof Error
          ? error.message
          : String(error)
      );

      this.options.onStatus("ERROR");
    }
  }

  async resume(sessionId: string) {
    if (!sessionId) {
      this.options.onStatus("ERROR");
      return;
    }

    this.options.onStatus("STARTING");

    this.sessionId = sessionId;

    this.options.onSession(
      this.sessionId
    );

    this.timeline(
      "Restoring active Guardian session."
    );

    const network =
      getNetworkStatus();

    const battery =
      await getBatteryLevel();

    this.options.onBattery(battery);

    try {
      this.timeline(
        "Restoring live location tracking."
      );

      const location =
        await getCurrentGPS();

      this.options.onLocation(location);

      this.timeline("GPS locked.");

      await updateGuardianSession(
        this.sessionId,
        "Guardian session restored after reload.",
        location,
        battery,
        network
      );

      this.startLocationWatch();

      this.timeline(
        "Live tracking restored."
      );

      this.options.onStatus("ACTIVE");
    } catch (error) {
      this.timeline(
        error instanceof Error
          ? error.message
          : String(error)
      );

      /*
       * The backend session still exists.
       * Do not silently mark it as stopped
       * just because GPS restoration failed.
       */
      this.options.onStatus("ERROR");
    }
  }

  async stop() {
    stopGPSWatch(this.watchId);

    this.watchId = null;

    if (this.sessionId) {
      await stopGuardianSession(
        this.sessionId
      );
    }

    this.timeline(
      "Guardian stopped safely."
    );

    this.sessionId = null;

    this.options.onSession(null);

    this.options.onStatus("STOPPED");
  }

  dispose() {
    stopGPSWatch(this.watchId);
    this.watchId = null;
  }
}