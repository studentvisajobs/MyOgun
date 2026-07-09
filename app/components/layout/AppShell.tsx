import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import MobileContainer from "./MobileContainer";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050505] pb-40 text-white">
      <MobileContainer>{children}</MobileContainer>
      <BottomNav />
    </main>
  );
}