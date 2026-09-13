import { prisma } from "@/lib/prisma";
import { LocationService } from "@/lib/services/LocationService";
import { NotificationService as PushNotificationService } from "@/lib/notifications/NotificationService";

type Presence = "ONLINE" | "RECENT" | "OFFLINE";

type SendInvitationInput = {
  senderId: string;
  senderName?: string | null;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  relation?: string | null;
};

type InvitationActionInput = {
  invitationId: string;
  receiverId: string;
  receiverName?: string | null;
  receiverPhone: string;
};

type AddGuardianInput = {
  userId: string;
  name: string;
  phone: string;
  email?: string | null;
  relation?: string | null;
  isPrimary?: boolean;
};

type RemoveGuardianInput = {
  userId: string;
  guardianId: string;
};

export class GuardianServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "GuardianServiceError";
    this.status = status;
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();

  return cleaned || null;
}

function getPresence(updatedAt: Date | null): {
  online: boolean;
  presence: Presence;
  sharingLocation: boolean;
} {
  if (!updatedAt) {
    return {
      online: false,
      presence: "OFFLINE",
      sharingLocation: false,
    };
  }

  const ageMilliseconds = Date.now() - updatedAt.getTime();
  const ageMinutes = ageMilliseconds / 60000;

  if (ageMinutes <= 2) {
    return {
      online: true,
      presence: "ONLINE",
      sharingLocation: true,
    };
  }

  if (ageMinutes <= 15) {
    return {
      online: false,
      presence: "RECENT",
      sharingLocation: true,
    };
  }

  return {
    online: false,
    presence: "OFFLINE",
    sharingLocation: false,
  };
}

export class GuardianService {
  static async getContacts(userId: string) {
    return prisma.guardianContact.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  static async addGuardian(input: AddGuardianInput) {
    const name = input.name.trim();
    const phone = normalizePhone(input.phone);

    if (!name) {
      throw new GuardianServiceError(
        "Guardian name is required.",
        400
      );
    }

    if (!phone) {
      throw new GuardianServiceError(
        "Guardian phone number is required.",
        400
      );
    }

    const existingGuardian =
      await prisma.guardianContact.findFirst({
        where: {
          userId: input.userId,
          phone,
        },
        select: {
          id: true,
        },
      });

    if (existingGuardian) {
      throw new GuardianServiceError(
        "This person is already in your Guardian Circle.",
        409
      );
    }

    return prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.guardianContact.updateMany({
          where: {
            userId: input.userId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.guardianContact.create({
        data: {
          userId: input.userId,
          name,
          phone,
          email: cleanOptionalText(input.email),
          relation: cleanOptionalText(input.relation),
          isPrimary: Boolean(input.isPrimary),
        },
      });
    });
  }

  static async removeGuardian(input: RemoveGuardianInput) {
    const guardian =
      await prisma.guardianContact.findFirst({
        where: {
          id: input.guardianId,
          userId: input.userId,
        },
        select: {
          id: true,
        },
      });

    if (!guardian) {
      throw new GuardianServiceError(
        "Guardian not found.",
        404
      );
    }

    await prisma.guardianContact.delete({
      where: {
        id: guardian.id,
      },
    });

    return {
      success: true,
    };
  }

 static async sendInvitation(
  input: SendInvitationInput
) {
  const receiverName = input.receiverName.trim();

  const receiverPhone = normalizePhone(
    input.receiverPhone
  );

  const senderPhone = normalizePhone(
    input.senderPhone
  );

  const relation = cleanOptionalText(
    input.relation
  );

  if (!receiverName) {
    throw new GuardianServiceError(
      "Guardian name is required.",
      400
    );
  }

  if (!receiverPhone) {
    throw new GuardianServiceError(
      "Guardian phone number is required.",
      400
    );
  }

  if (receiverPhone === senderPhone) {
    throw new GuardianServiceError(
      "You cannot invite yourself as a guardian.",
      400
    );
  }

  const receiverUser =
    await prisma.user.findFirst({
      where: {
        phone: receiverPhone,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

  const existingGuardian =
    await prisma.guardianContact.findFirst({
      where: {
        userId: input.senderId,
        phone: receiverPhone,
      },
      select: {
        id: true,
      },
    });

  if (existingGuardian) {
    throw new GuardianServiceError(
      "This person is already in your Guardian Circle.",
      409
    );
  }

  const existingInvitation =
    await prisma.guardianInvitation.findFirst({
      where: {
        senderId: input.senderId,
        receiverPhone,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });

  if (existingInvitation) {
    throw new GuardianServiceError(
      "A pending invitation has already been sent.",
      409
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const invitation =
        await tx.guardianInvitation.create({
          data: {
            senderId: input.senderId,
            receiverId:
              receiverUser?.id ?? null,

            receiverName:
              receiverUser?.name ||
              receiverName ||
              "Guardian",

            receiverPhone,
            relation,
            status: "PENDING",
          },

          include: {
            sender: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },

            receiver: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        });

      if (receiverUser) {
        await tx.notification.create({
          data: {
            userId: receiverUser.id,

            title:
              "Guardian Invitation",

            message: `${
              input.senderName ||
              input.senderPhone
            } invited you to join their Guardian Network.`,

            channel: "GUARDIAN",
          },
        });
      }

      return {
        invitation,
        receiverRegistered:
          Boolean(receiverUser),
      };
    }
  );

  if (receiverUser) {
    try {
      await PushNotificationService.notifyUser(
        receiverUser.id,

        "👥 Guardian Invitation",

        `${
          input.senderName ||
          input.senderPhone
        } invited you to join their Guardian Circle. Open MyOgun to accept or decline.`
      );
    } catch (pushError) {
      console.error(
        "Guardian invitation push error:",
        pushError
      );
    }
  }

  return result;
}

  static async getInvitations(
    userId: string,
    userPhone: string
  ) {
    const normalizedPhone = normalizePhone(userPhone);

    const [sent, received] = await Promise.all([
      prisma.guardianInvitation.findMany({
        where: {
          senderId: userId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.guardianInvitation.findMany({
        where: {
          OR: [
            {
              receiverId: userId,
            },
            {
              receiverPhone: normalizedPhone,
            },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      sent,
      received,
    };
  }

static async acceptInvitation(
  input: InvitationActionInput
) {
  const receiverPhone = normalizePhone(
    input.receiverPhone
  );

  const invitation =
    await prisma.guardianInvitation.findUnique({
      where: {
        id: input.invitationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

  if (!invitation) {
    throw new GuardianServiceError(
      "Invitation not found.",
      404
    );
  }

  const isRecipient =
    invitation.receiverId === input.receiverId ||
    normalizePhone(invitation.receiverPhone) ===
      receiverPhone;

  if (!isRecipient) {
    throw new GuardianServiceError(
      "This invitation is not for you.",
      403
    );
  }

  if (invitation.status !== "PENDING") {
    throw new GuardianServiceError(
      "Invitation has already been processed.",
      400
    );
  }

  const acceptedInvitation =
    await prisma.$transaction(async (tx) => {
      const accepted =
        await tx.guardianInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: "ACCEPTED",
            receiverId: input.receiverId,
          },
        });

      const senderGuardian =
        await tx.guardianContact.findFirst({
          where: {
            userId: invitation.senderId,
            phone: receiverPhone,
          },
          select: {
            id: true,
          },
        });

      if (!senderGuardian) {
        await tx.guardianContact.create({
          data: {
            userId: invitation.senderId,
            name:
              input.receiverName ||
              invitation.receiverName ||
              "Guardian",
            phone: receiverPhone,
            relation: invitation.relation,
            isPrimary: false,
          },
        });
      }

      const normalizedSenderPhone =
        normalizePhone(
          invitation.sender.phone
        );

      const receiverGuardian =
        await tx.guardianContact.findFirst({
          where: {
            userId: input.receiverId,
            phone: normalizedSenderPhone,
          },
          select: {
            id: true,
          },
        });

      if (!receiverGuardian) {
        await tx.guardianContact.create({
          data: {
            userId: input.receiverId,
            name:
              invitation.sender.name ||
              "Guardian",
            phone: normalizedSenderPhone,
            relation: invitation.relation,
            isPrimary: false,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: invitation.senderId,
          title:
            "Guardian Invitation Accepted",
          message: `${
            input.receiverName ||
            receiverPhone
          } accepted your guardian invitation.`,
          channel: "GUARDIAN",
        },
      });

      return accepted;
    });

  try {
    await PushNotificationService.notifyUser(
      invitation.senderId,
      "✅ Guardian Invitation Accepted",
      `${
        input.receiverName || receiverPhone
      } accepted your Guardian invitation.`
    );
  } catch (pushError) {
    console.error(
      "Guardian acceptance push error:",
      pushError
    );
  }

  return acceptedInvitation;
}


 static async rejectInvitation(
  input: InvitationActionInput
) {
  const receiverPhone = normalizePhone(
    input.receiverPhone
  );

  const invitation =
    await prisma.guardianInvitation.findUnique({
      where: {
        id: input.invitationId,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        receiverPhone: true,
        status: true,
      },
    });

  if (!invitation) {
    throw new GuardianServiceError(
      "Invitation not found.",
      404
    );
  }

  const isRecipient =
    invitation.receiverId === input.receiverId ||
    normalizePhone(invitation.receiverPhone) ===
      receiverPhone;

  if (!isRecipient) {
    throw new GuardianServiceError(
      "This invitation is not for you.",
      403
    );
  }

  if (invitation.status !== "PENDING") {
    throw new GuardianServiceError(
      "Invitation has already been processed.",
      400
    );
  }

  const rejectedInvitation =
    await prisma.$transaction(async (tx) => {
      const rejected =
        await tx.guardianInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            status: "REJECTED",
            receiverId: input.receiverId,
          },
        });

      await tx.notification.create({
        data: {
          userId: invitation.senderId,
          title:
            "Guardian Invitation Declined",
          message: `${
            input.receiverName ||
            receiverPhone
          } declined your guardian invitation.`,
          channel: "GUARDIAN",
        },
      });

      return rejected;
    });

  try {
    await PushNotificationService.notifyUser(
      invitation.senderId,
      "Guardian Invitation Declined",
      `${
        input.receiverName || receiverPhone
      } declined your Guardian invitation.`
    );
  } catch (pushError) {
    console.error(
      "Guardian rejection push error:",
      pushError
    );
  }

  return rejectedInvitation;
}

  static async getNetwork(userId: string) {
    const contacts =
      await prisma.guardianContact.findMany({
        where: {
          userId,
        },
        orderBy: [
          {
            isPrimary: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

    if (contacts.length === 0) {
      return {
        guardians: [],
        summary: {
          total: 0,
          online: 0,
          recent: 0,
          offline: 0,
          travelling: 0,
          emergencies: 0,
        },
        checkedAt: new Date().toISOString(),
      };
    }

    const contactPhones = [
      ...new Set(
        contacts.map((contact) =>
          normalizePhone(contact.phone)
        )
      ),
    ];

    const registeredUsers = await prisma.user.findMany({
      where: {
        phone: {
          in: contactPhones,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,

        sharedLocations: {
          take: 1,
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            latitude: true,
            longitude: true,
            accuracy: true,
            batteryLevel: true,
            status: true,
            updatedAt: true,
          },
        },

        guardianSessions: {
          where: {
            status: "ACTIVE",
          },
          take: 1,
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            batteryLevel: true,
            networkStatus: true,
            updatedAt: true,
          },
        },


        safeJourneys: {
          where: {
            status: {
              in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
            },
          },
          take: 1,
          orderBy: {
            startedAt: "desc",
          },
          select: {
            id: true,
            destination: true,
            estimatedArrival: true,
            latitude: true,
            longitude: true,
            status: true,
            startedAt: true,
          },
        },

        emergencySessions: {
          where: {
            status: {
              in: ["ACTIVE", "MONITORING", "RESPONDING"],
            },
          },
          take: 1,
          orderBy: {
            startedAt: "desc",
          },
          select: {
            id: true,
            status: true,
            latitude: true,
            longitude: true,
            startedAt: true,
            guardianMode: true,
            silentSOS: true,
            safeJourney: true,
          },
        },
      },
    });

    const usersByPhone = new Map(
      registeredUsers.map((registeredUser) => [
        normalizePhone(registeredUser.phone),
        registeredUser,
      ])
    );

    const guardians = contacts.map((contact) => {
      const registeredUser = usersByPhone.get(
        normalizePhone(contact.phone)
      );

      const location =
        registeredUser?.sharedLocations[0] ?? null;

      const guardianSession =
        registeredUser?.guardianSessions[0] ?? null;

      const journey =
        registeredUser?.safeJourneys[0] ?? null;

      const emergency =
        registeredUser?.emergencySessions[0] ?? null;

     const presence = LocationService.getPresence(
        location?.updatedAt
        );

      return {
        id: contact.id,
        userId: registeredUser?.id ?? null,

        name: registeredUser?.name || contact.name,
        phone: contact.phone,
        email: contact.email,
        relation: contact.relation,
        isPrimary: contact.isPrimary,

        registered: Boolean(registeredUser),

        online: presence.online,
        presence: presence.presence,
        lastSeen: location?.updatedAt ?? null,
        sharingLocation: presence.sharingLocation,

        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        accuracy: location?.accuracy ?? null,

          batteryLevel:
            guardianSession?.batteryLevel ??
            location?.batteryLevel ??
            null,

          networkStatus:
            guardianSession?.networkStatus ??
            location?.status ??
            "UNKNOWN",

        onJourney: Boolean(journey),

        journey: journey
          ? {
              id: journey.id,
              destination: journey.destination,
              estimatedArrival:
                journey.estimatedArrival,
              latitude: journey.latitude,
              longitude: journey.longitude,
              status: journey.status,
              startedAt: journey.startedAt,
            }
          : null,

        inEmergency: Boolean(emergency),

        emergency: emergency
          ? {
              id: emergency.id,
              status: emergency.status,
              latitude: emergency.latitude,
              longitude: emergency.longitude,
              startedAt: emergency.startedAt,
              guardianMode: emergency.guardianMode,
              silentSOS: emergency.silentSOS,
              safeJourney: emergency.safeJourney,
            }
          : null,
      };
    });

    const summary = {
      total: guardians.length,

      online: guardians.filter(
        (guardian) =>
          guardian.presence === "ONLINE"
      ).length,

      recent: guardians.filter(
        (guardian) =>
          guardian.presence === "RECENT"
      ).length,

      offline: guardians.filter(
        (guardian) =>
          guardian.presence === "OFFLINE"
      ).length,

      travelling: guardians.filter(
        (guardian) => guardian.onJourney
      ).length,

      emergencies: guardians.filter(
        (guardian) => guardian.inEmergency
      ).length,
    };

    return {
      guardians,
      summary,
      checkedAt: new Date().toISOString(),
    };
  }
}