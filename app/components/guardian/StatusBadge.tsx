type StatusBadgeProps = {
  status?: string | null;
};

function getStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
    case "RESPONDING":
    case "ARRIVED":
    case "COMPLETED":
      return "border-green-500/40 bg-green-500/10 text-green-300";

    case "NOTIFIED":
    case "VIEWED":
      return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";

    case "STOPPED":
    case "RESOLVED":
      return "border-blue-500/40 bg-blue-500/10 text-blue-300";

    case "FAILED":
    case "CANCELLED":
      return "border-red-500/40 bg-red-500/10 text-red-300";

    default:
      return "border-white/20 bg-white/5 text-white/70";
  }
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const normalizedStatus =
    status?.trim().toUpperCase() || "UNKNOWN";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${getStatusClasses(
        normalizedStatus
      )}`}
    >
      <span
        className="mr-2 h-2 w-2 rounded-full bg-current"
        aria-hidden="true"
      />

      {normalizedStatus.replaceAll("_", " ")}
    </span>
  );
}