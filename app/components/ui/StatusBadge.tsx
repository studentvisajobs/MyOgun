type StatusBadgeProps = {
  label: string;
};

export default function StatusBadge({ label }: StatusBadgeProps) {
  const status = label.toUpperCase();

  const styles = {
    PENDING: "bg-yellow-500/20 text-yellow-300",
    VERIFIED: "bg-emerald-500 text-black",
    CRITICAL: "bg-red-500 text-white",
    RESPONDING: "bg-blue-500 text-white",
    RESOLVED: "bg-white/10 text-white",
    FALSE: "bg-zinc-700 text-white",
  };

  return (
    <span
      className={`rounded-full px-4 py-2 text-xs font-black ${
        styles[status as keyof typeof styles] ?? "bg-white/10 text-white"
      }`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}