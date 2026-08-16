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
      title="Profile"
      subtitle="Manage your account and safety preferences."
    >
      <div className="space-y-4">
        <Link
          href="/profile/edit"
          className="block rounded-[2rem] border border-white/10 bg-[#121212] p-5 transition hover:border-emerald-500/40"
        >
          👤 Edit Profile
        </Link>

        <Link
          href="/profile/location"
          className="block rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-5 transition hover:border-emerald-500/40"
        >
          <p className="font-black">
            📍 Preferred Location
          </p>

          <p className="mt-1 text-sm text-white/50">
            Choose the area MyOgun should prioritise for community reports and nearby alerts.
          </p>

          {(user.preferredArea ||
            user.preferredLocalGovernment) && (
            <p className="mt-3 text-sm font-bold text-emerald-300">
              {[
                user.preferredArea,
                user.preferredLocalGovernment,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
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