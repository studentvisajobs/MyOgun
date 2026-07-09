import Link from "next/link";

const actions = [
 {
  title: "Guardian Circle",
  description: "View live family location and safety status.",
  href: "/guardian-circle",
  icon: "🛡️",
  style: "border-emerald-500/20 bg-emerald-500/10 hover:border-emerald-500/50",
},
  {
    title: "Report Incident",
    description: "Alert your community with evidence.",
    href: "/report",
    icon: "🚨",
    style: "border-red-500/20 bg-red-500/10 hover:border-red-500/50",
  },
  {
    title: "Safe Journey",
    description: "Let MyOgun monitor your trip.",
    href: "/safe-journey",
    icon: "🚗",
    style: "border-yellow-500/20 bg-yellow-500/10 hover:border-yellow-500/50",
  },
  {
    title: "Silent SOS",
    description: "Request help discreetly.",
    href: "/silent-sos",
    icon: "🔴",
    style: "border-red-500/20 bg-[#111] hover:border-red-500/50",
  },
];

export default function QuickActions() {
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
            SAFETY TOOLS
          </p>
          <h2 className="mt-2 text-2xl font-black">
            What do you need?
          </h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-[2rem] border p-5 transition active:scale-95 ${action.style}`}
          >
            <div className="text-4xl">{action.icon}</div>

            <h3 className="mt-5 text-lg font-black leading-tight">
              {action.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}