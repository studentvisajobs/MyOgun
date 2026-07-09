export function detectArea(
  latitude: number,
  longitude: number
) {
  if (
    latitude > 53.50 &&
    latitude < 53.53
  ) {
    return {
      area: "Ilaro",
      localGovernment: "Yewa South",
    };
  }

  if (
    latitude > 53.53 &&
    latitude < 53.55
  ) {
    return {
      area: "Abeokuta",
      localGovernment: "Abeokuta South",
    };
  }

  return {
    area: "Unknown",
    localGovernment: "Unknown",
  };
}