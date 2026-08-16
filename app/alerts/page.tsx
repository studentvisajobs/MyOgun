import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function AlertsPage() {
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

    take: 20,
  });

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="font-bold text-emerald-400"
        >
          ← Home
        </Link>

        <h1 className="mt-8 text-4xl font-black">
          Nearby Alerts
        </h1>

        <p className="mt-2 text-sm text-white/50">
          {hasPreference
            ? `Showing alerts for ${
                preferredArea ||
                preferredLocalGovernment
              }.`
            : "Showing recent alerts from all locations."}
        </p>

        <div className="mt-6 space-y-4">
          {incidents.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#121212] p-6 text-center">
              <p className="text-4xl">📍</p>

              <p className="mt-3 font-black">
                No alerts found
              </p>

              <p className="mt-2 text-sm text-white/50">
                No incidents have been reported for your preferred location yet.
              </p>
            </div>
          ) : (
            incidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="block rounded-3xl border border-white/10 bg-[#121212] p-5"
              >
                <p className="text-xs font-black text-emerald-400">
                  {incident.type.replaceAll(
                    "_",
                    " "
                  )}
                </p>

                <h2 className="mt-2 text-xl font-black">
                  {incident.title}
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  {incident.area ||
                    incident.localGovernment ||
                    "Unknown"}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}