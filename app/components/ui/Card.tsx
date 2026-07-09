import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-[#121212] p-5 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}