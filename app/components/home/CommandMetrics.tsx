type Props = {
  guardianCount: number;
  activeAlerts: number;
};

export default function CommandMetrics({
  guardianCount,
  activeAlerts,
}: Props) {
  const items = [
    {
      label: "Guardian",
      value: guardianCount > 0 ? "READY" : "SETUP",
      icon: "🛡️",
    },
    {
      label: "Journey",
      value: "OFF",
      icon: "🚗",
    },
    {
      label: "Alerts",
      value: String(activeAlerts),
      icon: "⚠️",
    },
    {
      label: "Emergency",
      value: "READY",
      icon: "🚨",
    },
  ];

  return (
    <section className="mt-5 grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[2rem] border border-white/10 bg-[#111] p-5"
        >
          <div className="text-3xl">{item.icon}</div>

          <p className="mt-4 text-sm text-white/50">
            {item.label}
          </p>

          <p className="mt-1 text-xl font-black text-emerald-400">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}