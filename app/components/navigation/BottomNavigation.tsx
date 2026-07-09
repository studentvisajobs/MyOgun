"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Home",
    icon: "🏠",
  },
  {
    href: "/protect",
    label: "Protect",
    icon: "🛡️",
  },
  {
    href: "/report",
    label: "",
    icon: "➕",
    primary: true,
  },
  {
    href: "/community",
    label: "Community",
    icon: "🌍",
  },
  {
    href: "/profile",
    label: "Me",
    icon: "👤",
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-[#090909]/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const active = isActive(item.href);

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-20 w-20 -translate-y-5 items-center justify-center rounded-full bg-emerald-400 text-4xl font-black text-black shadow-[0_0_35px_rgba(16,185,129,.45)] transition active:scale-95"
              >
                {item.icon}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[60px] flex-col items-center gap-1 rounded-xl py-1 transition ${
                active
                  ? "text-emerald-400"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>

              <span className="text-[11px] font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}