
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  CirclePlus,
  Globe2,
  UserRound,
} from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/report", label: "Report", icon: CirclePlus, primary: true },
  { href: "/community", label: "Community", icon: Globe2 },
  { href: "/profile", label: "My Account", icon: UserRound },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="flex w-full max-w-md items-center justify-around rounded-[28px] border border-white/10 bg-[#090909]/95 px-2 py-3 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 transition active:scale-95 ${
                item.primary || active
                  ? "text-emerald-400"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  item.primary
                    ? "bg-emerald-950 text-emerald-400"
                    : active
                      ? "bg-white/15"
                      : "bg-white/10"
                }`}
              >
                <Icon size={23} strokeWidth={2} />
              </span>

              <span className="text-[11px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
