import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "danger" | "dark" | "ghost";
  className?: string;
};

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-4 text-center font-black transition";

  const styles = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-400",
    danger: "bg-red-600 text-white hover:bg-red-500",
    dark: "bg-[#121212] text-white border border-white/10 hover:border-emerald-500/40",
    ghost: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
  };

  const classes = `${base} ${styles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

return (
  <button onClick={onClick} className={classes} type="button">
    {children}
  </button>
);
}