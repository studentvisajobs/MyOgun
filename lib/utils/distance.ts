const EARTH_RADIUS_METRES = 6_371_000;

type Coordinates = {
  latitude: number;
  longitude: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function validateCoordinates(
  coordinates: Coordinates
) {
  const { latitude, longitude } = coordinates;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error(
      "Valid latitude and longitude are required."
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error(
      "Latitude must be between -90 and 90."
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error(
      "Longitude must be between -180 and 180."
    );
  }
}

export function calculateDistanceMetres(
  origin: Coordinates,
  destination: Coordinates
) {
  validateCoordinates(origin);
  validateCoordinates(destination);

  const latitudeDifference = toRadians(
    destination.latitude - origin.latitude
  );

  const longitudeDifference = toRadians(
    destination.longitude - origin.longitude
  );

  const originLatitude = toRadians(
    origin.latitude
  );

  const destinationLatitude = toRadians(
    destination.latitude
  );

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    );

  return Math.round(
    EARTH_RADIUS_METRES * centralAngle
  );
}

export function calculateDistanceKilometres(
  origin: Coordinates,
  destination: Coordinates
) {
  return (
    calculateDistanceMetres(
      origin,
      destination
    ) / 1000
  );
}

export function isWithinRadius(
  origin: Coordinates,
  destination: Coordinates,
  radiusMetres: number
) {
  if (
    !Number.isFinite(radiusMetres) ||
    radiusMetres < 0
  ) {
    throw new Error(
      "Radius must be a valid non-negative number."
    );
  }

  return (
    calculateDistanceMetres(
      origin,
      destination
    ) <= radiusMetres
  );
}

export function formatDistance(
  distanceMetres: number
) {
  if (
    !Number.isFinite(distanceMetres) ||
    distanceMetres < 0
  ) {
    return "Unknown distance";
  }

  if (distanceMetres < 1000) {
    return `${Math.round(distanceMetres)} m`;
  }

  return `${(
    distanceMetres / 1000
  ).toFixed(1)} km`;
}