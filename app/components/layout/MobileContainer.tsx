import { ReactNode } from "react";

export default function MobileContainer({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-md px-5 py-6">{children}</section>;
}