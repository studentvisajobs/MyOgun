import Link from "next/link";

type Props = {
  user?: {
    name?: string | null;
  } | null;
};

export default function HomeHero({ user }: Props) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-sm font-black tracking-[0.45em] text-emerald-400">
          MYOGUN
        </p>

        <h1 className="mt-3 text-3xl font-black leading-tight">
          Hello, {user?.name || "there"}
        </h1>

        <p className="mt-2 text-sm text-white/60">
          Protecting You. Wherever. Whenever.
        </p>
      </div>

      <Link
        href="/profile"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[#111] text-2xl"
      >
        👤
      </Link>
    </header>
  );
}