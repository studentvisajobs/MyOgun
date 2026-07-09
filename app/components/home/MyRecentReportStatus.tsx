import Link from "next/link";
import Card from "../ui/Card";
import StatusBadge from "../ui/StatusBadge";

type Props = {
  incident:
    | {
        id: string;
        title: string;
        status: string;
        createdAt: Date;
      }
    | null;
};

export default function MyRecentReportStatus({ incident }: Props) {
  if (!incident) return null;

  const message =
    incident.status === "RESPONDING"
      ? "🚑 Emergency Response Assigned"
      : incident.status === "RESOLVED"
      ? "✅ Incident Resolved"
      : incident.status === "VERIFIED"
      ? "🟢 Community Verified"
      : "🟡 Awaiting Community Verification";

  return (
    <Card className="mt-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-emerald-400">
            YOUR LATEST REPORT
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {incident.title}
          </h2>

          <p className="mt-2 text-sm text-white/60">
            {message}
          </p>
        </div>

        <StatusBadge label={incident.status} />
      </div>

      <div className="mt-5 flex items-center justify-end">
        <Link
          href={`/incidents/${incident.id}`}
          className="rounded-full border border-emerald-500/30 px-5 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-black"
        >
          View Report →
        </Link>
      </div>
    </Card>
  );
}