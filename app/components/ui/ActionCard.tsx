import Link from "next/link";
import { ReactNode } from "react";

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  color?: string;
};

export default function ActionCard({
  href,
  title,
  description,
  icon,
  badge,
  color = "border-white/10",
}: ActionCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-[2rem] border ${color} bg-[#111] p-5 transition-all duration-300 hover:border-emerald-500/40 hover:-translate-y-1 active:scale-[0.98]`}
    >
      <div className="flex items-start justify-between">
        <div className="text-4xl">{icon}</div>

        {badge && (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
            {badge}
          </span>
        )}
      </div>

      <h3 className="mt-6 text-xl font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/60">
        {description}
      </p>
    </Link>
  );
}