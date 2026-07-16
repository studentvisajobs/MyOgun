import { prisma } from "@/lib/prisma";

export type PresenceStatus = "ONLINE" | "RECENT" | "OFFLINE";

type ShareLocationInput = {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

export class LocationServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "LocationServiceError";
    this.status = status;
  }
}

function validateCoordinates(
  latitude: number,
  longitude: number
) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new LocationServiceError(
      "Valid latitude and longitude are required.",
      400
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new LocationServiceError(
      "Latitude must be between -90 and 90.",
      400
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new LocationServiceError(
      "Longitude must be between -180 and 180.",
      400
    );
  }
}

function normalizeAccuracy(value?: number | null) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return value;
}

function normalizeBatteryLevel(value?: number | null) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeNetworkStatus(value?: string | null) {
  if (!value?.trim()) {
    return "ONLINE";
  }

  return value.trim().toUpperCase();
}

export class LocationService {
  static getPresence(
    updatedAt: Date | string | null | undefined
  ): {
    online: boolean;
    presence: PresenceStatus;
    sharingLocation: boolean;
  } {
    if (!updatedAt) {
      return {
        online: false,
        presence: "OFFLINE",
        sharingLocation: false,
      };
    }

    const timestamp = new Date(updatedAt).getTime();

    if (Number.isNaN(timestamp)) {
      return {
        online: false,
        presence: "OFFLINE",
        sharingLocation: false,
      };
    }

    const ageMinutes =
      (Date.now() - timestamp) / 60_000;

    if (ageMinutes <= 2) {
      return {
        online: true,
        presence: "ONLINE",
        sharingLocation: true,
      };
    }

    if (ageMinutes <= 15) {
      return {
        online: false,
        presence: "RECENT",
        sharingLocation: true,
      };
    }

    return {
      online: false,
      presence: "OFFLINE",
      sharingLocation: false,
    };
  }

  static async share(input: ShareLocationInput) {
    validateCoordinates(
      input.latitude,
      input.longitude
    );

    const accuracy = normalizeAccuracy(input.accuracy);

    const batteryLevel = normalizeBatteryLevel(
      input.batteryLevel
    );

    const networkStatus = normalizeNetworkStatus(
      input.networkStatus
    );

    return prisma.sharedLocation.upsert({
      where: {
        userId: input.userId,
      },
      update: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy,
        batteryLevel,
        status: networkStatus,
      },
      create: {
        userId: input.userId,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy,
        batteryLevel,
        status: networkStatus,
      },
    });
  }

  static async getCurrent(userId: string) {
    return prisma.sharedLocation.findUnique({
      where: {
        userId,
      },
    });
  }

  static async stopSharing(userId: string) {
    const existingLocation =
      await prisma.sharedLocation.findUnique({
        where: {
          userId,
        },
        select: {
          id: true,
        },
      });

    if (!existingLocation) {
      return null;
    }

    return prisma.sharedLocation.update({
      where: {
        userId,
      },
      data: {
        status: "OFFLINE",
      },
    });
  }

  static distanceInMeters(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number
  ) {
    validateCoordinates(latitude1, longitude1);
    validateCoordinates(latitude2, longitude2);

    const earthRadius = 6_371_000;

    const toRadians = (value: number) =>
      (value * Math.PI) / 180;

    const latitudeDifference = toRadians(
      latitude2 - latitude1
    );

    const longitudeDifference = toRadians(
      longitude2 - longitude1
    );

    const calculation =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(toRadians(latitude1)) *
        Math.cos(toRadians(latitude2)) *
        Math.sin(longitudeDifference / 2) ** 2;

    const safeCalculation = Math.min(
      1,
      Math.max(0, calculation)
    );

    const angularDistance =
      2 *
      Math.atan2(
        Math.sqrt(safeCalculation),
        Math.sqrt(1 - safeCalculation)
      );

    return earthRadius * angularDistance;
  }

  static formatDistance(meters: number) {
    if (!Number.isFinite(meters) || meters < 0) {
      return "Distance unavailable";
    }

    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }

    return `${(meters / 1000).toFixed(1)}km`;
  }

  static isNearby(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
    radiusMeters = 1000
  ) {
    if (
      !Number.isFinite(radiusMeters) ||
      radiusMeters < 0
    ) {
      return false;
    }

    return (
      this.distanceInMeters(
        latitude1,
        longitude1,
        latitude2,
        longitude2
      ) <= radiusMeters
    );
  }

  static bearing(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number
  ) {
    validateCoordinates(latitude1, longitude1);
    validateCoordinates(latitude2, longitude2);

    const toRadians = (value: number) =>
      (value * Math.PI) / 180;

    const toDegrees = (value: number) =>
      (value * 180) / Math.PI;

    const startLatitude = toRadians(latitude1);
    const endLatitude = toRadians(latitude2);

    const startLongitude = toRadians(longitude1);
    const endLongitude = toRadians(longitude2);

    const longitudeDifference =
      endLongitude - startLongitude;

    const y =
      Math.sin(longitudeDifference) *
      Math.cos(endLatitude);

    const x =
      Math.cos(startLatitude) *
        Math.sin(endLatitude) -
      Math.sin(startLatitude) *
        Math.cos(endLatitude) *
        Math.cos(longitudeDifference);

    return (
      toDegrees(Math.atan2(y, x)) + 360
    ) % 360;
  }

  static async getNearbyIncidents(
    latitude: number,
    longitude: number,
    radiusMeters = 5000
  ) {
    validateCoordinates(latitude, longitude);

    if (
      !Number.isFinite(radiusMeters) ||
      radiusMeters <= 0
    ) {
      throw new LocationServiceError(
        "Search radius must be greater than zero.",
        400
      );
    }

    const incidents = await prisma.incident.findMany({
      where: {
        status: {
          in: [
            "PENDING",
            "VERIFIED",
            "CRITICAL",
            "RESPONDING",
          ],
        },
      },
      include: {
        evidence: true,
        confirmations: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return incidents
      .map((incident) => ({
        ...incident,
        distance: this.distanceInMeters(
          latitude,
          longitude,
          incident.latitude,
          incident.longitude
        ),
      }))
      .filter(
        (incident) =>
          incident.distance <= radiusMeters
      )
      .sort(
        (first, second) =>
          first.distance - second.distance
      );
  }

  static async getNearbyUsers(
    latitude: number,
    longitude: number,
    radiusMeters = 5000,
    excludeUserId?: string
  ) {
    validateCoordinates(latitude, longitude);

    if (
      !Number.isFinite(radiusMeters) ||
      radiusMeters <= 0
    ) {
      throw new LocationServiceError(
        "Search radius must be greater than zero.",
        400
      );
    }

    const locations =
      await prisma.sharedLocation.findMany({
        where: excludeUserId
          ? {
              userId: {
                not: excludeUserId,
              },
            }
          : undefined,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

    return locations
      .map((location) => ({
        ...location,
        distance: this.distanceInMeters(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        ),
      }))
      .filter(
        (location) =>
          location.distance <= radiusMeters
      )
      .sort(
        (first, second) =>
          first.distance - second.distance
      );
  }
}