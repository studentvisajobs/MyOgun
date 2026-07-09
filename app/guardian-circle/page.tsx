import MobilePage from "@/app/components/layout/MobilePage";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GuardianCircleClient from "./GuardianCircleClient";

export default async function GuardianCirclePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const guardians = await prisma.guardianContact.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const myLocation = await prisma.sharedLocation.findUnique({
    where: { userId: user.id },
  });

  return (
    <MobilePage
      title="Guardian Circle"
      subtitle="See trusted people, live location status and emergency readiness."
    >
      <GuardianCircleClient
        guardians={guardians.map((g) => ({
          id: g.id,
          name: g.name,
          phone: g.phone,
          email: g.email,
          relation: g.relation,
          isPrimary: g.isPrimary,
        }))}
        myLocation={
          myLocation
            ? {
                id: myLocation.id,
                userId: myLocation.userId,
                latitude: myLocation.latitude,
                longitude: myLocation.longitude,
                accuracy: myLocation.accuracy,
                batteryLevel: myLocation.batteryLevel,
                status: myLocation.status,
                createdAt: myLocation.createdAt.toISOString(),
                updatedAt: myLocation.updatedAt.toISOString(),
              }
            : null
        }
      />
    </MobilePage>
  );
}