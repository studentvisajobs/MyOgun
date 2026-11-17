
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUser,
  findInvitations,
  findUsers,
  findContacts,
} = vi.hoisted(() => ({
  findUser: vi.fn(),
  findInvitations: vi.fn(),
  findUsers: vi.fn(),
  findContacts: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUser,
      findMany: findUsers,
    },
    guardianInvitation: {
      findMany: findInvitations,
    },
    guardianContact: {
      findMany: findContacts,
    },
  },
}));

import { GuardianRecipientService } from "../../lib/services/GuardianRecipientService";

describe("GuardianRecipientService", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    findUser.mockResolvedValue({
      phone: "+447700900001",
    });

    findInvitations.mockResolvedValue([]);
    findUsers.mockResolvedValue([]);
    findContacts.mockResolvedValue([]);
  });

  it("excludes guardians without accepted invitations", async () => {
    const result =
      await GuardianRecipientService.getAuthorizedGuardianIds("user-1");

    expect(result).toEqual([]);
    expect(findUsers).not.toHaveBeenCalled();
  });

  it("includes a guardian with an accepted invitation and saved contact", async () => {
    findInvitations.mockResolvedValue([
      {
        senderId: "user-1",
        receiverId: "guardian-1",
      },
    ]);

    findUsers.mockResolvedValue([
      {
        id: "guardian-1",
        phone: "+447700900002",
      },
    ]);

    findContacts.mockResolvedValue([
      {
        phone: "+44 7700 900002",
      },
    ]);

    const result =
      await GuardianRecipientService.getAuthorizedGuardianIds("user-1");

    expect(result).toEqual(["guardian-1"]);
  });

  it("excludes a removed guardian contact", async () => {
    findInvitations.mockResolvedValue([
      {
        senderId: "user-1",
        receiverId: "guardian-1",
      },
    ]);

    findUsers.mockResolvedValue([
      {
        id: "guardian-1",
        phone: "+447700900002",
      },
    ]);

    findContacts.mockResolvedValue([]);

    const result =
      await GuardianRecipientService.getAuthorizedGuardianIds("user-1");

    expect(result).toEqual([]);
  });

  it("excludes an invitation that is not accepted", async () => {
    findInvitations.mockResolvedValue([]);

    findContacts.mockResolvedValue([
      {
        phone: "+447700900002",
      },
    ]);

    const result =
      await GuardianRecipientService.getAuthorizedGuardianIds("user-1");

    expect(result).toEqual([]);
  });

  it("returns no recipients when the user does not exist", async () => {
    findUser.mockResolvedValue(null);

    const result =
      await GuardianRecipientService.getAuthorizedGuardianIds("missing-user");

    expect(result).toEqual([]);
    expect(findInvitations).not.toHaveBeenCalled();
  });
});
