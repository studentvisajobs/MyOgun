import Link from "next/link";

export default function GuardianModeCard() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-emerald-500/30 bg-[#121212] p-6 shadow-2xl">
      <div className="flex items-center justify-between gap-5">
        <div>
          <p className="text-sm font-black text-emerald-400">
            GUARDIAN MODE
          </p>

          <h2 className="mt-2 text-4xl font-black">Ready</h2>

          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Live protection, tracking, and emergency response.
          </p>
        </div>

        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500/10">
          <div className="absolute h-full w-full animate-ping rounded-full bg-emerald-500/10" />
          <span className="relative text-4xl">🛡️</span>
        </div>
      </div>

      <Link
        href="/guardian-mode"
        className="mt-6 block rounded-full bg-emerald-500 py-4 text-center text-lg font-black text-black transition hover:bg-emerald-400"
      >
        Activate
      </Link>
    </div>
  );
}