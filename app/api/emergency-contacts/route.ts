export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const contacts = await prisma.emergencyContact.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ success: true, contacts });
}

export async function POST(request: Request) {
  const body = await request.json();

  const { name, phone } = body;

  if (!name || !phone) {
    return Response.json(
      { error: "Name and phone number are required" },
      { status: 400 }
    );
  }

  const contact = await prisma.emergencyContact.create({
    data: { name, phone },
  });

  return Response.json({ success: true, contact });
}