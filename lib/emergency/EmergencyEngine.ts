import { getEmergencyBatteryLevel } from "./EmergencyBattery";
import {
  getEmergencyGPS,
  stopEmergencyGPSWatch,
  watchEmergencyGPS,
} from "./EmergencyGPS";
import { getEmergencyNetworkStatus } from "./EmergencyNetwork";
import {
  startEmergencySession,
  stopEmergencySession,
  updateEmergencySession,
} from "./EmergencySession";
import { createEmergencyTimelineEvent } from "./EmergencyTimeline";
import type {
  EmergencyEngineOptions,
  EmergencyLocation,
  EmergencyStatus,
} from "./EmergencyTypes";

export class EmergencyEngine {
  private watchId: number | null = null;
  private sessionId: string | null = null;
  private options: EmergencyEngineOptions;

  constructor(options: EmergencyEngineOptions) {
    this.options = options;
  }

  private status(status: EmergencyStatus) {
    this.options.onStatus(status);
  }

  private timeline(message: string) {
    this.options.onTimeline(createEmergencyTimelineEvent(message));
  }

  async start() {
    this.status("STARTING");
    this.timeline(`${this.options.mode} activation started.`);

    const network = getEmergencyNetworkStatus();
    this.timeline(`Network status: ${network}.`);

    const battery = await getEmergencyBatteryLevel();
    this.options.onBattery(battery);

    if (battery !== null) {
      this.timeline(`Battery level: ${battery}%.`);
    }

    try {
      this.timeline("Requesting GPS location.");

      const location = await getEmergencyGPS();

      this.options.onLocation(location);
      this.timeline("GPS locked.");

      const session = await startEmergencySession(
        this.options.mode,
        location,
        battery,
        network
      );

      this.sessionId = session.session.id;
      this.options.onSession(this.sessionId);

      this.timeline("Emergency session saved to backend.");
      this.timeline("Live tracking started.");

      this.watchId = watchEmergencyGPS(
        async (newLocation: EmergencyLocation) => {
          this.options.onLocation(newLocation);

          const currentBattery = await getEmergencyBatteryLevel();
          const currentNetwork = getEmergencyNetworkStatus();

          this.options.onBattery(currentBattery);

          if (this.sessionId) {
            await updateEmergencySession(
              this.sessionId,
              "Location updated.",
              newLocation,
              currentBattery,
              currentNetwork
            );
          }

          this.timeline("Location updated.");
        },
        (message) => {
          this.timeline(message);
        }
      );

      if (this.sessionId) {
        await updateEmergencySession(
          this.sessionId,
          `${this.options.mode} fully active.`,
          location,
          battery,
          network
        );
      }

      this.timeline(`${this.options.mode} fully active.`);
      this.status("ACTIVE");
    } catch (error) {
      this.timeline(String(error));
      this.status("ERROR");
    }
  }

  async stop() {
    this.status("STOPPING");

    stopEmergencyGPSWatch(this.watchId);
    this.watchId = null;

    if (this.sessionId) {
      await stopEmergencySession(this.sessionId);
    }

    this.timeline(`${this.options.mode} stopped safely.`);

    this.sessionId = null;
    this.options.onSession(null);
    this.status("STOPPED");
  }
}