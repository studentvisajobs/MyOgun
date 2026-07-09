import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  colour?: "emerald" | "red" | "yellow" | "blue" | "white";
};

export default function StatCard({
  title,
  value,
  subtitle,
  colour = "white",
}: StatCardProps) {
  const colours = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    blue: "text-sky-400",
    white: "text-white",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <p className="text-xs uppercase tracking-widest text-white/50">
        {title}
      </p>

      <p
        className={`mt-3 text-3xl font-black ${
          colours[colour]
        }`}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-sm text-white/50">
          {subtitle}
        </p>
      )}
    </div>
  );
}