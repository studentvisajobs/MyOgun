export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET() {
  await prisma.incident.createMany({
    data: [
      {
        title: "Kidnapping Alert near Ilaro",
        description: "Test Ogun map incident.",
        type: "KIDNAPPING",
        latitude: 6.889,
        longitude: 3.014,
        area: "Ilaro",
        localGovernment: "Yewa South",
        confidenceScore: 85,
        status: "CRITICAL",
      },
      {
        title: "Robbery near Abeokuta",
        description: "Test Ogun map incident.",
        type: "ROBBERY",
        latitude: 7.1475,
        longitude: 3.3619,
        area: "Abeokuta",
        localGovernment: "Abeokuta South",
        confidenceScore: 75,
        status: "VERIFIED",
      },
      {
        title: "Accident near Sagamu",
        description: "Test Ogun map incident.",
        type: "ACCIDENT",
        latitude: 6.8485,
        longitude: 3.6463,
        area: "Sagamu",
        localGovernment: "Sagamu",
        confidenceScore: 60,
        status: "VERIFIED",
      },
    ],
  });

  return Response.json({
    success: true,
    message: "Ogun test incidents created",
  });
}