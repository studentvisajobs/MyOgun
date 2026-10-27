import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("myogun_user_id")?.value;

  if (!token) return null;

  const userId = await verifySessionToken(token);

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
  });
}
