export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { sendEmergencySMS } from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const contacts = await prisma.emergencyContact.findMany();

    for (const contact of contacts) {
      try {
        await sendEmergencySMS(
          contact.phone,
          body.message
        );

        console.log(`SMS sent to ${contact.phone}`);
      } catch (error) {
        console.error(
          `Failed to send SMS to ${contact.phone}`,
          error
        );
      }
    }

    return Response.json({
      success: true,
      contacts: contacts.length,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to send SOS SMS" },
      { status: 500 }
    );
  }
}