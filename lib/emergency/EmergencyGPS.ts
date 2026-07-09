import type { EmergencyLocation } from "./EmergencyTypes";

export function getEmergencyGPS(): Promise<EmergencyLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("GPS is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        reject("GPS permission denied or unavailable.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  });
}

export function watchEmergencyGPS(
  onUpdate: (location: EmergencyLocation) => void,
  onError: (message: string) => void
) {
  if (!navigator.geolocation) {
    onError("GPS is not supported on this device.");
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    () => {
      onError("GPS update failed.");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );
}

export function stopEmergencyGPSWatch(watchId: number | null) {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}