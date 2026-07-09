import Link from "next/link";

export default function NearbyAlertsCard({ count }: { count: number }) {
  return (
    <Link
      href="/alerts"
      className="rounded-[1.7rem] border border-white/10 bg-[#121212] p-5"
    >
      <div className="text-3xl">⚠️</div>
      <h3 className="mt-4 text-lg font-black">Nearby Alerts</h3>
      <p className="mt-2 text-sm text-white/60">
        {count} active alerts
      </p>
    </Link>
  );
}