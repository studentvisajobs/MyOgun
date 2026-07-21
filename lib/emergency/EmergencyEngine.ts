import { getEmergencyBatteryLevel } from "./EmergencyBattery";
import {
  getEmergencyGPS,
  stopEmergencyGPSWatch,
  watchEmergencyGPS,
} from "./EmergencyGPS";
import { getEmergencyNetworkStatus } from "./EmergencyNetwork";
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

export class EmergencyEngine {
  private watchId: number | null = null;
  private sessionId: string | null = null;
  private running = false;
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

    const network = getEmergencyNetworkStatus();

    return {
      battery,
      location,
      network,
    };
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
      const { battery, location, network } =
        await this.collectDeviceState();

      this.options.onBattery(battery);
      this.options.onLocation(location);

      this.addTimeline(
        `Network status: ${network}.`
      );

      if (battery !== null) {
        this.addTimeline(
          `Battery level: ${battery}%.`
        );
      }

      this.addTimeline("GPS locked.");

      const response = await startEmergencySession(
        this.options.mode,
        location,
        battery,
        network
      );

      this.sessionId = response.session.id;

        this.options.onStartedAt?.(
        response.session.startedAt ?? null
      );

this.addTimeline(
  "Assigning guardian responders..."
);

try {
  const responderResponse = await fetch(
    "/api/guardian/responders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
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
    "Responder assignment skipped."
  );
}

      this.options.onSession(this.sessionId);

      this.addTimeline(
        "Emergency session saved."
      );

      await updateEmergencySession(
        this.sessionId,
        `${this.options.mode} fully active.`,
        location,
        battery,
        network
      );

      this.watchId = watchEmergencyGPS(
        async (newLocation: EmergencyLocation) => {
          this.options.onLocation(newLocation);

          const currentBattery =
            await getEmergencyBatteryLevel();

          const currentNetwork =
            getEmergencyNetworkStatus();

          this.options.onBattery(currentBattery);

          if (!this.sessionId) {
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

            this.addTimeline(
              "Location update could not be saved."
            );
          }
        },
        (message) => {
          this.addTimeline(message);
        }
      );

      this.addTimeline(
        `${this.options.mode} fully active.`
      );

      this.setStatus("ACTIVE");
    } catch (error) {
      console.error(
        "Emergency engine start error:",
        error
      );

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
  if (this.running || this.sessionId) {
    return false;
  }

  try {
    const response =
      await getActiveEmergencySession();

    const session = response.session;

    if (
      !session ||
      session.status !== "ACTIVE"
    ) {
      return false;
    }

    this.sessionId = session.id;
this.running = true;

this.options.onStartedAt?.(
  session.startedAt ?? null
);

    this.options.onSession(session.id);
    this.options.onBattery(
      session.batteryLevel
    );

    if (
      session.latitude !== null &&
      session.longitude !== null
    ) {
      this.options.onLocation({
        latitude: session.latitude,
        longitude: session.longitude,
        accuracy: undefined,
      });
    }

    this.addTimeline(
      "Active SOS session restored."
    );

    this.watchId = watchEmergencyGPS(
      async (newLocation: EmergencyLocation) => {
        this.options.onLocation(newLocation);

        const currentBattery =
          await getEmergencyBatteryLevel();

        const currentNetwork =
          getEmergencyNetworkStatus();

        this.options.onBattery(currentBattery);

        if (!this.sessionId) {
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
    "Restored emergency location update error:",
    error
  );

  if (
    error instanceof Error &&
    error.message.includes(
      "Active Guardian session not found"
    )
  ) {
    this.running = false;
    this.sessionId = null;

    this.options.onSession(null);
this.options.onStartedAt?.(null);
this.setStatus("READY");

    this.addTimeline(
      "The emergency session has already ended."
    );

    stopEmergencyGPSWatch(this.watchId);
    this.watchId = null;

    return;
  }

  this.addTimeline(
    "Location update could not be saved."
  );
}
      },
      (message) => {
        this.addTimeline(message);
      }
    );

    this.setStatus("ACTIVE");

    return true;
  } catch (error) {
    console.error(
      "Emergency session restoration error:",
      error
    );

    this.addTimeline(
      "Unable to restore the active SOS session."
    );

    return false;
  }
}

dispose() {
  stopEmergencyGPSWatch(this.watchId);
  this.watchId = null;
}

  async stop() {
    if (!this.running && !this.sessionId) {
      return;
    }

    this.setStatus("STOPPING");

    stopEmergencyGPSWatch(this.watchId);
    this.watchId = null;

    try {
      if (this.sessionId) {
        await stopEmergencySession(
          this.sessionId
        );
      }

      this.addTimeline(
        `${this.options.mode} stopped safely.`
      );

      this.sessionId = null;
this.options.onSession(null);
this.options.onStartedAt?.(null);
this.running = false;

      this.setStatus("STOPPED");
    } catch (error) {
      console.error(
        "Emergency engine stop error:",
        error
      );

      this.addTimeline(
        error instanceof Error
          ? error.message
          : "Unable to stop emergency session."
      );

      this.setStatus("ERROR");
    }
  }
}