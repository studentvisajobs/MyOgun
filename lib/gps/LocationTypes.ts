export type GPSMode =
  | "guardian"
  | "journey"
  | "emergency";

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GPSCallbacks {
  onLocation?: (location: GPSLocation) => void;
  onError?: (error: GeolocationPositionError) => void;
}