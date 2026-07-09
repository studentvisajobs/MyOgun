import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MobilePage from "@/app/components/layout/MobilePage";
import LogoutButton from "./LogoutButton";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return (
    <MobilePage
      title="My Profile"
      subtitle="Manage your account, guardian contacts and emergency information."
    >
      <div className="space-y-4">
        <Link
          href="/profile/edit"
          className="block rounded-[2rem] border border-white/10 bg-[#121212] p-5 transition hover:border-emerald-500/40"
        >
          👤 Edit Profile
        </Link>

        <Link
          href="/guardian-circle"
          className="block rounded-[2rem] border border-white/10 bg-[#121212] p-5 transition hover:border-emerald-500/40"
        >
          🛡 Guardian Contacts
        </Link>

        <Link
          href="/emergency-contacts"
          className="block rounded-[2rem] border border-white/10 bg-[#121212] p-5 transition hover:border-emerald-500/40"
        >
          🚑 Emergency Information
        </Link>

        <LogoutButton />
      </div>
    </MobilePage>
  );
}