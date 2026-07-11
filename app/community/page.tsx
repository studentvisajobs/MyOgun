import { prisma } from "@/lib/prisma";
import MobilePage from "@/app/components/layout/MobilePage";
import CommunityFeed from "@/app/components/home/CommunityFeed";

export default async function CommunityPage() {
  const incidents = await prisma.incident.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });

  return (
    <MobilePage
      title="Community"
      subtitle="Live safety reports and verified incidents near you."
      showBack={false}
    >
      <CommunityFeed incidents={incidents} />
    </MobilePage>
  );
}