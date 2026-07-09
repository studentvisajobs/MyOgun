import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import MobilePage from "@/app/components/layout/MobilePage";
import SafetyStatusEngine from "@/app/components/safety/SafetyStatusEngine";
import ActionCard from "@/app/components/ui/ActionCard";


const mainFeatures = [
  {
    href: "/guardian-mode",
    icon: "🛡️",
    eyebrow: "Personal Protection",
    title: "Guardian Mode",
    description: "Share your live location and safety status with trusted guardians.",
    color: "border-emerald-500/25 bg-emerald-500/10",
  },
  {
    href: "/guardian-circle",
    icon: "👨‍👩‍👧",
    eyebrow: "Family Safety",
    title: "Guardian Circle",
    description: "View trusted people, live sharing and emergency readiness.",
    color: "border-cyan-500/25 bg-cyan-500/10",
  },
  {
    href: "/safe-journey",
    icon: "🚗",
    eyebrow: "Travel Protection",
    title: "Safe Journey",
    description: "Let MyOgun monitor your trip until you arrive safely.",
    color: "border-blue-500/25 bg-blue-500/10",
  },
  {
    href: "/silent-sos",
    icon: "🚨",
    eyebrow: "Emergency",
    title: "Silent SOS",
    description: "Request help discreetly when you cannot speak or call.",
    color: "border-red-500/25 bg-red-500/10",
  },
];

const secondaryFeatures = [
  {
    href: "/family-location",
    icon: "📍",
    title: "Family Location",
    description: "Live location sharing with trusted people.",
  },
  {
    href: "/emergency-contacts",
    icon: "🚑",
    title: "Emergency Contacts",
    description: "Medical info, ICE contacts and emergency details.",
  },
  {
    href: "/nearby-danger",
    icon: "⚠️",
    title: "Nearby Danger",
    description: "Check incidents and threats close to you.",
  },
  {
    href: "/profile",
    icon: "⚙️",
    title: "Safety Settings",
    description: "Manage account, preferences and safety setup.",
  },
];

export default async function ProtectPage() {
  const user = await getCurrentUser();

  const guardianCount = user
    ? await prisma.guardianContact.count({
        where: { userId: user.id },
      })
    : 0;

  const activeAlerts = await prisma.incident.count({
    where: {
      status: {
        in: ["CRITICAL", "VERIFIED", "RESPONDING"],
      },
    },
  });

  const myLocation = user
    ? await prisma.sharedLocation.findUnique({
        where: { userId: user.id },
      })
    : null;

const activeJourney = null;

  return (
    <MobilePage
      title="Protect"
      subtitle="Your personal and family safety command centre."
      showBack={false}
    >
      <SafetyStatusEngine
        guardianCount={guardianCount}
        activeAlerts={activeAlerts}
        activeJourney={!!activeJourney}
        locationSharing={!!myLocation}
      />

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-400">
              Safety Tools
            </p>
            <h2 className="mt-2 text-2xl font-black">What do you need?</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mainFeatures.map((feature) => (
            <ActionCard
              key={feature.href}
              href={feature.href}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              badge={feature.eyebrow}
              color={feature.color}
            />
          ))}

        </div>
      </section>

      <section className="mt-8">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-emerald-400">
          More Protection
        </p>

        <div className="space-y-3">
          {secondaryFeatures.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="flex items-center gap-4 rounded-[1.7rem] border border-white/10 bg-[#111] p-4 transition hover:border-emerald-500/40 active:scale-[0.98]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                {feature.icon}
              </div>

              <div className="flex-1">
                <h3 className="font-black">{feature.title}</h3>
                <p className="mt-1 text-sm text-white/55">
                  {feature.description}
                </p>
              </div>

              <div className="text-xl text-white/30">→</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-yellow-500/20 bg-yellow-500/10 p-5">
        <h3 className="text-lg font-black text-yellow-300">Coming Next</h3>

        <div className="mt-4 space-y-2 text-sm text-white/70">
          <p>• Real-time guardian location updates</p>
          <p>• Battery, speed and travel mode indicators</p>
          <p>• AI scream, panic and crash detection</p>
          <p>• Offline emergency alerts</p>
        </div>
      </section>
    </MobilePage>
  );
}