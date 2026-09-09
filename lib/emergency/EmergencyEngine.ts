import { getEmergencyBatteryLevel } from "./EmergencyBattery";
import {
  getEmergencyGPS,
  stopEmergencyGPSWatch,
  watchEmergencyGPS,
} from "./EmergencyGPS";
import {
  getEmergencyNetworkStatus,
  watchEmergencyNetwork,
} from "./EmergencyNetwork";
import {
  getActiveEmergencySession,
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

const OFFLINE_EMERGENCY_KEY =
  "myogun_offline_emergency";

export class EmergencyEngine {
  private watchId: number | null = null;
  private stopNetworkWatch: (() => void) | null =
    null;

  private sessionId: string | null = null;
  private running = false;
  private syncing = false;

  private lastLocation: EmergencyLocation | null =
    null;

  private lastBattery: number | null = null;

  private options: EmergencyEngineOptions;

  constructor(options: EmergencyEngineOptions) {
    this.options = options;
  }

  private setStatus(status: EmergencyStatus) {
    this.options.onStatus(status);
  }

  private addTimeline(message: string) {
    this.options.onTimeline(
      createEmergencyTimelineEvent(message)
    );
  }

  private async collectDeviceState() {
    const [battery, location] = await Promise.all([
      getEmergencyBatteryLevel(),
      getEmergencyGPS(),
    ]);

    const network =
      getEmergencyNetworkStatus();

    this.lastBattery = battery;
    this.lastLocation = location;

    return {
      battery,
      location,
      network,
    };
  }

  private saveOfflineEmergency(
    location: EmergencyLocation | null,
    battery: number | null
  ) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(
        OFFLINE_EMERGENCY_KEY,
        JSON.stringify({
          mode: this.options.mode,
          location,
          battery,
          startedAt:
            new Date().toISOString(),
          pendingSync: true,
        })
      );
    } catch (error) {
      console.error(
        "Unable to save offline emergency:",
        error
      );
    }
  }

  private clearOfflineEmergency() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(
        OFFLINE_EMERGENCY_KEY
      );
    } catch {
      // Ignore storage cleanup errors.
    }
  }

  private startNetworkMonitoring() {
    this.stopNetworkWatch?.();

    this.stopNetworkWatch =
      watchEmergencyNetwork(
        (networkStatus) => {
          if (!this.running) {
            return;
          }

          if (networkStatus === "OFFLINE") {
            this.addTimeline(
              "Internet connection lost. Offline emergency fallback active."
            );

            this.saveOfflineEmergency(
              this.lastLocation,
              this.lastBattery
            );

            return;
          }

          if (
            networkStatus === "ONLINE" &&
            !this.sessionId
          ) {
            this.addTimeline(
              "Internet connection restored. Synchronising emergency..."
            );

            void this.syncOfflineEmergency();
          }
        }
      );
  }

  private startGPSMonitoring() {
    stopEmergencyGPSWatch(this.watchId);

    this.watchId = watchEmergencyGPS(
      async (
        newLocation: EmergencyLocation
      ) => {
        this.lastLocation = newLocation;

        this.options.onLocation(
          newLocation
        );

        const currentBattery =
          await getEmergencyBatteryLevel();

        const currentNetwork =
          getEmergencyNetworkStatus();

        this.lastBattery =
          currentBattery;

        this.options.onBattery(
          currentBattery
        );

        if (!this.sessionId) {
          this.saveOfflineEmergency(
            newLocation,
            currentBattery
          );

          this.addTimeline(
            "Offline GPS location updated."
          );

          return;
        }

        try {
          await updateEmergencySession(
            this.sessionId,
            "Location updated.",
            newLocation,
            currentBattery,
            currentNetwork
          );

          this.addTimeline(
            "Live location updated."
          );
        } catch (error) {
          console.error(
            "Emergency location update error:",
            error
          );

          this.saveOfflineEmergency(
            newLocation,
            currentBattery
          );

          this.addTimeline(
            "Location saved locally until connection returns."
          );
        }
      },
      (message) => {
        this.addTimeline(message);
      }
    );
  }

  private async assignResponders() {
    if (!this.sessionId) {
      return;
    }

    this.addTimeline(
      "Assigning guardian responders..."
    );

    try {
      const responderResponse =
        await fetch(
          "/api/guardian/responders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sessionId:
                this.sessionId,
            }),
          }
        );

      if (responderResponse.ok) {
        this.addTimeline(
          "Guardian responders assigned."
        );
      } else {
        this.addTimeline(
          "Unable to assign responders."
        );
      }
    } catch (error) {
      console.error(
        "Assign responders error:",
        error
      );

      this.addTimeline(
        "Responder assignment will retry when online."
      );
    }
  }

  private async createOnlineSession(
    location: EmergencyLocation,
    battery: number | null
  ) {
    const network =
      getEmergencyNetworkStatus();

    const response =
      await startEmergencySession(
        this.options.mode,
        location,
        battery,
        network
      );

    this.sessionId =
      response.session.id;

    this.options.onSession(
      this.sessionId
    );

    this.options.onStartedAt?.(
      response.session.startedAt ??
        null
    );

    this.addTimeline(
      "Emergency session saved."
    );

    await this.assignResponders();

    await updateEmergencySession(
      this.sessionId,
      `${this.options.mode} fully active.`,
      location,
      battery,
      network
    );

    this.clearOfflineEmergency();
  }

  private async syncOfflineEmergency() {
    if (
      !this.running ||
      this.sessionId ||
      this.syncing
    ) {
      return;
    }

    if (
      getEmergencyNetworkStatus() !==
      "ONLINE"
    ) {
      return;
    }

    if (!this.lastLocation) {
      return;
    }

    this.syncing = true;

    try {
      await this.createOnlineSession(
        this.lastLocation,
        this.lastBattery
      );

      this.addTimeline(
        "Offline emergency synchronised successfully."
      );

      this.setStatus("ACTIVE");
    } catch (error) {
      console.error(
        "Offline emergency sync error:",
        error
      );

      this.addTimeline(
        "Emergency sync failed. MyOgun will retry when connection returns."
      );
    } finally {
      this.syncing = false;
    }
  }

  async start() {
    if (this.running) {
      return;
    }

    this.running = true;

    this.setStatus("STARTING");

    this.addTimeline(
      `${this.options.mode} activation started.`
    );

    try {
      const {
        battery,
        location,
        network,
      } =
        await this.collectDeviceState();

      this.options.onBattery(
        battery
      );

      this.options.onLocation(
        location
      );

      this.addTimeline(
        `Network status: ${network}.`
      );

      if (battery !== null) {
        this.addTimeline(
          `Battery level: ${battery}%.`
        );
      }

      this.addTimeline(
        "GPS locked."
      );

      if (network === "OFFLINE") {
        this.saveOfflineEmergency(
          location,
          battery
        );

        this.options.onSession(
          null
        );

        this.options.onStartedAt?.(
          new Date().toISOString()
        );

        this.addTimeline(
          "OFFLINE EMERGENCY MODE ACTIVE."
        );

        this.addTimeline(
          "GPS tracking continues locally."
        );

        this.addTimeline(
          "Emergency will synchronise automatically when internet returns."
        );

        this.startGPSMonitoring();
        this.startNetworkMonitoring();

        this.setStatus("ACTIVE");

        return;
      }

      await this.createOnlineSession(
        location,
        battery
      );

      this.startGPSMonitoring();
      this.startNetworkMonitoring();

      this.addTimeline(
        `${this.options.mode} fully active.`
      );

      this.setStatus("ACTIVE");
    } catch (error) {
      console.error(
        "Emergency engine start error:",
        error
      );

      /*
       * If the server fails but GPS is
       * available, do not kill the SOS.
       * Fall back to local emergency mode.
       */
      if (this.lastLocation) {
        this.saveOfflineEmergency(
          this.lastLocation,
          this.lastBattery
        );

        this.addTimeline(
          "Server unavailable. Offline emergency fallback activated."
        );

        this.startGPSMonitoring();
        this.startNetworkMonitoring();

        this.setStatus("ACTIVE");

        return;
      }

      this.addTimeline(
        error instanceof Error
          ? error.message
          : "Emergency activation failed."
      );

      this.setStatus("ERROR");

      this.running = false;
    }
  }

  async resume() {
    if (
      this.running ||
      this.sessionId
    ) {
      return false;
    }

    try {
      const response =
        await getActiveEmergencySession();

      const session =
        response.session;

      if (
        !session ||
        session.status !== "ACTIVE"
      ) {
        return false;
      }

      this.sessionId =
        session.id;

      this.running = true;

      this.options.onStartedAt?.(
        session.startedAt ?? null
      );

      this.options.onSession(
        session.id
      );

      this.options.onBattery(
        session.batteryLevel
      );

      this.lastBattery =
        session.batteryLevel;

      if (
        session.latitude !== null &&
        session.longitude !== null
      ) {
        const restoredLocation: EmergencyLocation =
          {
            latitude:
              session.latitude,

            longitude:
              session.longitude,

            accuracy: undefined,
          };

        this.lastLocation =
          restoredLocation;

        this.options.onLocation(
          restoredLocation
        );
      }

      this.addTimeline(
        "Active SOS session restored."
      );

      this.startGPSMonitoring();
      this.startNetworkMonitoring();

      this.setStatus("ACTIVE");

      return true;
    } catch (error) {
      console.error(
        "Emergency session restoration error:",
        error
      );

      /*
       * There may be a locally stored
       * emergency while the device is
       * offline.
       */
      if (
        typeof window !== "undefined"
      ) {
        try {
          const stored =
            localStorage.getItem(
              OFFLINE_EMERGENCY_KEY
            );

          if (stored) {
            const offlineEmergency =
              JSON.parse(stored);

            this.running = true;

            if (
              offlineEmergency.location
            ) {
              this.lastLocation =
                offlineEmergency.location;

              this.options.onLocation(
                offlineEmergency.location
              );
            }

            this.lastBattery =
              offlineEmergency.battery ??
              null;

            this.options.onBattery(
              this.lastBattery
            );

            this.options.onStartedAt?.(
              offlineEmergency.startedAt ??
                null
            );

            this.addTimeline(
              "Offline emergency restored."
            );

            this.startGPSMonitoring();
            this.startNetworkMonitoring();

            this.setStatus("ACTIVE");

            return true;
          }
        } catch (storageError) {
          console.error(
            "Offline emergency restore error:",
            storageError
          );
        }
      }

      this.addTimeline(
        "Unable to restore the active SOS session."
      );

      return false;
    }
  }

  dispose() {
    stopEmergencyGPSWatch(
      this.watchId
    );

    this.watchId = null;

    this.stopNetworkWatch?.();

    this.stopNetworkWatch =
      null;
  }

  async stop() {
    if (
      !this.running &&
      !this.sessionId
    ) {
      return;
    }

    this.setStatus("STOPPING");

    stopEmergencyGPSWatch(
      this.watchId
    );

    this.watchId = null;

    this.stopNetworkWatch?.();

    this.stopNetworkWatch =
      null;

    try {
      if (this.sessionId) {
        await stopEmergencySession(
          this.sessionId
        );
      }

      this.clearOfflineEmergency();

      this.addTimeline(
        `${this.options.mode} stopped safely.`
      );

      this.sessionId = null;

      this.options.onSession(
        null
      );

      this.options.onStartedAt?.(
        null
      );

      this.running = false;

      this.setStatus("STOPPED");
    } catch (error) {
      console.error(
        "Emergency engine stop error:",
        error
      );

      /*
       * If we're offline while stopping,
       * still stop the local tracking.
       */
      if (
        getEmergencyNetworkStatus() ===
        "OFFLINE"
      ) {
        this.clearOfflineEmergency();

        this.sessionId = null;

        this.options.onSession(
          null
        );

        this.options.onStartedAt?.(
          null
        );

        this.running = false;

        this.addTimeline(
          "Offline emergency stopped locally."
        );

        this.setStatus("STOPPED");

        return;
      }

      this.addTimeline(
        error instanceof Error
          ? error.message
          : "Unable to stop emergency session."
      );

      this.setStatus("ERROR");
    }
  }
}