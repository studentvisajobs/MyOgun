export type EmergencyNetworkStatus =
  | "ONLINE"
  | "OFFLINE";

export function getEmergencyNetworkStatus(): EmergencyNetworkStatus {
  if (typeof navigator === "undefined") {
    return "OFFLINE";
  }

  return navigator.onLine
    ? "ONLINE"
    : "OFFLINE";
}

export function isEmergencyOnline() {
  return getEmergencyNetworkStatus() === "ONLINE";
}

export function watchEmergencyNetwork(
  onChange: (
    status: EmergencyNetworkStatus
  ) => void
) {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined"
  ) {
    return () => {};
  }

  const handleOnline = () => {
    onChange("ONLINE");
  };

  const handleOffline = () => {
    onChange("OFFLINE");
  };

  window.addEventListener(
    "online",
    handleOnline
  );

  window.addEventListener(
    "offline",
    handleOffline
  );

  // Report the current state immediately.
  onChange(getEmergencyNetworkStatus());

  return () => {
    window.removeEventListener(
      "online",
      handleOnline
    );

    window.removeEventListener(
      "offline",
      handleOffline
    );
  };
}