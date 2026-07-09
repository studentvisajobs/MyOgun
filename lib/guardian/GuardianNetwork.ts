export function getNetworkStatus() {
  return navigator.onLine ? "ONLINE" : "OFFLINE";
}