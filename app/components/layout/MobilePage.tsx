import Link from "next/link";
import { ReactNode } from "react";
import BottomNavigation from "../navigation/BottomNavigation";

type MobilePageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBack?: boolean;
};

export default function MobilePage({
  title,
  subtitle,
  children,
  showBack = true,
}: MobilePageProps) {
  return (
    <main className="min-h-screen bg-black px-6 pb-28 pt-8 text-white">
      <div className="mx-auto max-w-md">
        {showBack && (
          <Link
            href="/"
            className="inline-flex items-center font-bold text-emerald-400 hover:text-emerald-300"
          >
            ← Home
          </Link>
        )}

        <div className="mt-6">
          <p className="text-sm font-black tracking-[0.3em] text-emerald-400">
            MYOGUN • SAFETY NETWORK
          </p>

          <h1 className="mt-3 text-4xl font-black">{title}</h1>

          {subtitle && <p className="mt-3 text-white/60">{subtitle}</p>}
        </div>

        <div className="mt-8">{children}</div>
      </div>

      <BottomNavigation />
    </main>
  );
}