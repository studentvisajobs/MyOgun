import { GPSLocation } from "./LocationTypes";

export class LocationUploader {
  static async upload(
    journeyId: string,
    location: GPSLocation
  ) {
    try {
      await fetch("/api/journey/update", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          journeyId,

          latitude: location.latitude,

          longitude: location.longitude,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }
}