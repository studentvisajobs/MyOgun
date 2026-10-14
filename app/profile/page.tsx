import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MobilePage from "@/app/components/layout/MobilePage";
import LogoutButton from "./LogoutButton";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const card =
    "block rounded-3xl border border-white/10 bg-[#121212] p-5 transition hover:border-emerald-500/50";

  const greenCard =
    "block rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 transition hover:border-emerald-500/60";

  return (
    <MobilePage
      title="Profile"
      subtitle="Manage your account and safety preferences."
    >
      <div className="space-y-6 pb-16">

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">
            My Account
          </h2>

          <Link href="/profile/edit" className={card}>
            <p className="font-bold">Edit Profile</p>
            <p className="mt-1 text-sm text-white/50">
              Update your personal information.
            </p>
          </Link>

          <Link href="/profile/location" className={greenCard}>
            <p className="font-bold">Preferred Location</p>
            <p className="mt-1 text-sm text-white/50">
              Choose the area MyOgun should prioritise for
              community reports and nearby alerts.
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
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">
            Guardian Network
          </h2>

          <p className="text-sm text-white/50">
            Manage trusted guardians in your personal safety network.
          </p>

          <Link href="/guardian-circle" className={greenCard}>
            <p className="font-bold">Manage Guardian Contacts →</p>
            <p className="mt-1 text-sm text-white/50">
              View and manage your guardian connections.
            </p>
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">
            Emergency Contacts
          </h2>

          <p className="text-sm text-white/50">
            Keep important contact information available
            for emergency situations.
          </p>

          <Link
            href="/emergency-contacts#add-contact"
            className={greenCard}
          >
            <p className="font-bold">Add Emergency Contact →</p>
            <p className="mt-1 text-sm text-white/50">
              Save a new emergency contact.
            </p>
          </Link>

          <Link
            href="/emergency-contacts#manage-contacts"
            className={card}
          >
            <p className="font-bold">Manage Emergency Contacts →</p>
            <p className="mt-1 text-sm text-white/50">
              View and organise your saved emergency contacts.
            </p>
          </Link>
        </section>

        <div className="pt-4">
          <LogoutButton />
        </div>

      </div>
    </MobilePage>
  );
}

