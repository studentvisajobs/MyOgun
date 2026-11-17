
import { ReactNode } from "react";
import BottomNavigation from "../navigation/BottomNavigation";
import MobileContainer from "./MobileContainer";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050505] pb-40 text-white">
      <MobileContainer>{children}</MobileContainer>
      <BottomNavigation />
    </main>
  );
}
