import Link from "next/link";
import NotificationBell from "../notifications/NotificationBell";

type TopBarProps = {
  user?: {
    name?: string | null;
  } | null;
};

export default function TopBar({
  user,
}: TopBarProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-sm font-black tracking-[0.45em] text-emerald-400">
          MYOGUN
        </p>

        <h1 className="mt-3 text-5xl font-black leading-[0.95]">
          Guardian
          <br />
          Ready
        </h1>

        <p className="mt-3 text-sm text-white/50">
          {user?.name
            ? `Welcome, ${user.name}`
            : "Your digital bodyguard"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <Link
          href={user ? "/profile" : "/login"}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#121212] text-2xl shadow-xl"
        >
          👤
        </Link>
      </div>
    </header>
  );
}