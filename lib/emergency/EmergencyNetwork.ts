export function getEmergencyNetworkStatus() {
  return navigator.onLine ? "ONLINE" : "OFFLINE";
}