import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import MobilePage from "@/app/components/layout/MobilePage";
import CommunityFeed from "@/app/components/home/CommunityFeed";

export default async function CommunityPage() {
  const user = await getCurrentUser();

  const preferredArea =
    user?.preferredArea?.trim() || null;

  const preferredLocalGovernment =
    user?.preferredLocalGovernment?.trim() || null;

  const hasPreference =
    Boolean(preferredArea) ||
    Boolean(preferredLocalGovernment);

  const incidents = await prisma.incident.findMany({
    where: hasPreference
      ? {
          OR: [
            ...(preferredArea
              ? [
                  {
                    area: {
                      equals: preferredArea,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),

            ...(preferredLocalGovernment
              ? [
                  {
                    localGovernment: {
                      equals:
                        preferredLocalGovernment,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        }
      : undefined,

    orderBy: {
      createdAt: "desc",
    },

    take: 30,
  });

  return (
    <MobilePage
      title="Community"
      subtitle={
        hasPreference
          ? `Safety reports prioritised for ${
              preferredArea ||
              preferredLocalGovernment
            }.`
          : "Live safety reports and verified incidents near you."
      }
      showBack={false}
    >
      {hasPreference &&
        incidents.length === 0 && (
          <div className="mb-5 rounded-[2rem] border border-yellow-500/20 bg-yellow-500/10 p-5">
            <p className="font-black text-yellow-200">
              No reports found for your preferred location yet.
            </p>

            <p className="mt-2 text-sm text-white/50">
              MyOgun will show incidents here as they are reported.
            </p>
          </div>
        )}

      <CommunityFeed incidents={incidents} />
    </MobilePage>
  );
}