import { GPSCallbacks, GPSLocation } from "./LocationTypes";

export class GPSManager {
  private watchId: number | null = null;

  start(callbacks: GPSCallbacks = {}) {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    if (this.watchId !== null) {
      this.stop();
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: GPSLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        callbacks.onLocation?.(location);
      },

      (error) => {
        callbacks.onError?.(error);
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  isRunning() {
    return this.watchId !== null;
  }
}