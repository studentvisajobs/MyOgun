import Link from "next/link";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-full border border-white/10 bg-black/90 px-5 py-3 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between text-xs font-bold text-white/50">
        <Link href="/" className="flex flex-col items-center gap-1 text-emerald-400">
          <span className="text-xl">🏠</span>
          Home
        </Link>

        <Link href="/guardian-mode" className="flex flex-col items-center gap-1">
          <span className="text-xl">🛡️</span>
          Protect
        </Link>

        <Link
          href="/report"
          className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl font-black text-black shadow-xl shadow-emerald-500/30"
        >
          +
        </Link>

        <Link href="/incidents" className="flex flex-col items-center gap-1">
          <span className="text-xl">🌍</span>
          Community
        </Link>

        <Link href="/profile" className="flex flex-col items-center gap-1">
          <span className="text-xl">👤</span>
          Me
        </Link>
      </div>
    </nav>
  );
}