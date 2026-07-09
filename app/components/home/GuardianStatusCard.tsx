import Link from "next/link";

type Props = {
  guardianCount: number;
  activeAlerts: number;
};

export default function GuardianStatusCard({
  guardianCount,
  activeAlerts,
}: Props) {
  return (
    <section className="mt-5 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="text-5xl">🛡️</div>

        <div className="flex-1">
          <h2 className="text-2xl font-black text-emerald-400">
            Stay Alert
          </h2>
          <p className="mt-1 text-sm text-white/60">Safety System Ready</p>

          <div className="mt-3 inline-flex rounded-full bg-black/40 px-4 py-2 text-sm font-black text-emerald-300">
            SYSTEM READY ✅
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-2xl font-black text-emerald-400">
            {guardianCount}
          </p>
          <p className="text-sm text-white/60">Guardian Contacts</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-2xl font-black text-red-300">
            {activeAlerts}
          </p>
          <p className="text-sm text-white/60">Active Alerts</p>
        </div>
      </div>

      <Link
        href="/guardian-mode"
        className="mt-4 block rounded-full bg-emerald-500 py-3 text-center text-base font-black text-black"
      >
        Hold for Guardian Mode
      </Link>
    </section>
  );
}