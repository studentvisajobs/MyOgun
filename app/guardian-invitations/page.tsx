"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

type InvitationUser = {
  id: string;
  name: string | null;
  phone: string;
};

type GuardianInvitation = {
  id: string;
  receiverPhone: string;
  receiverName: string | null;
  relation: string | null;
  status: InvitationStatus;
  createdAt: string;
  updatedAt: string;
  sender: InvitationUser;
  receiver: InvitationUser | null;
};

type InvitationsResponse = {
  sent: GuardianInvitation[];
  received: GuardianInvitation[];
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusStyles(status: InvitationStatus) {
  if (status === "ACCEPTED") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "REJECTED") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

function getStatusLabel(status: InvitationStatus) {
  if (status === "ACCEPTED") {
    return "Accepted";
  }

  if (status === "REJECTED") {
    return "Rejected";
  }

  return "Pending";
}

export default function GuardianInvitationsPage() {
  const [sentInvitations, setSentInvitations] = useState<
    GuardianInvitation[]
  >([]);

  const [receivedInvitations, setReceivedInvitations] = useState<
    GuardianInvitation[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch("/api/guardian-invitations", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load guardian invitations."
        );
      }

      const invitations = data as InvitationsResponse;

      setSentInvitations(invitations.sent ?? []);
      setReceivedInvitations(invitations.received ?? []);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to load guardian invitations.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function respondToInvitation(
    invitationId: string,
    action: "accept" | "reject"
  ) {
    try {
      setProcessingId(invitationId);
      setMessage(null);

      const response = await fetch(
        `/api/guardian-invitations/${invitationId}/${action}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Unable to ${action} invitation.`
        );
      }

      setMessage({
        type: "success",
        text:
          data.message ||
          `Guardian invitation ${
            action === "accept" ? "accepted" : "rejected"
          }.`,
      });

      await loadInvitations();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : `Unable to ${action} invitation.`,
      });
    } finally {
      setProcessingId(null);
    }
  }

  const pendingReceivedCount = receivedInvitations.filter(
    (invitation) => invitation.status === "PENDING"
  ).length;

  const pendingSentCount = sentInvitations.filter(
    (invitation) => invitation.status === "PENDING"
  ).length;

  return (
    <main className="min-h-screen bg-black px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
              Guardian Network
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Guardian Invitations
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
              Manage the trusted people who can support you during
              journeys, emergencies and Guardian Mode sessions.
            </p>
          </div>

          <Link
            href="/guardian-circle"
            className="shrink-0 rounded-full border border-white/10 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/5"
          >
            Back
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-white/10 bg-[#101010] p-5">
            <p className="text-sm text-white/45">Received pending</p>
            <p className="mt-2 text-3xl font-black text-emerald-400">
              {pendingReceivedCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#101010] p-5">
            <p className="text-sm text-white/45">Sent pending</p>
            <p className="mt-2 text-3xl font-black text-amber-300">
              {pendingSentCount}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Link
            href="/guardian-circle/add"
            className="flex-1 rounded-full bg-emerald-500 px-5 py-4 text-center font-black text-black transition hover:bg-emerald-400"
          >
            Invite Guardian
          </Link>

          <button
            type="button"
            onClick={() => void loadInvitations()}
            disabled={loading}
            className="rounded-full border border-white/10 px-5 py-4 font-bold text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {message && (
          <div
            role="alert"
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">
                Received invitations
              </h2>

              <p className="mt-1 text-sm text-white/45">
                Invitations sent to your MyOgun phone number.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/55">
              {receivedInvitations.length}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <InvitationLoadingCard />
            ) : receivedInvitations.length === 0 ? (
              <EmptyState
                title="No received invitations"
                description="Guardian invitations sent to you will appear here."
              />
            ) : (
              receivedInvitations.map((invitation) => {
                const senderName =
                  invitation.sender.name ||
                  invitation.sender.phone;

                const isProcessing =
                  processingId === invitation.id;

                return (
                  <article
                    key={invitation.id}
                    className="rounded-[2rem] border border-white/10 bg-[#101010] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-xl">
                          🛡️
                        </div>

                        <h3 className="mt-4 truncate text-lg font-black">
                          {senderName}
                        </h3>

                        <p className="mt-1 text-sm text-white/45">
                          {invitation.sender.phone}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyles(
                          invitation.status
                        )}`}
                      >
                        {getStatusLabel(invitation.status)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-sm text-white/60">
                        {senderName} wants you to join their Guardian
                        Network.
                      </p>

                      {invitation.relation && (
                        <p className="mt-2 text-xs text-white/40">
                          Relationship: {invitation.relation}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-white/35">
                        Received {formatDate(invitation.createdAt)}
                      </p>
                    </div>

                    {invitation.status === "PENDING" && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            void respondToInvitation(
                              invitation.id,
                              "accept"
                            )
                          }
                          className="rounded-full bg-emerald-500 px-4 py-3 font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? "Processing..." : "Accept"}
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            void respondToInvitation(
                              invitation.id,
                              "reject"
                            )
                          }
                          className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-3 font-bold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">
                Sent invitations
              </h2>

              <p className="mt-1 text-sm text-white/45">
                Track invitations you have sent to trusted people.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/55">
              {sentInvitations.length}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <InvitationLoadingCard />
            ) : sentInvitations.length === 0 ? (
              <EmptyState
                title="No sent invitations"
                description="Invite a trusted person to start building your Guardian Network."
              />
            ) : (
              sentInvitations.map((invitation) => {
                const receiverName =
                  invitation.receiver?.name ||
                  invitation.receiverName ||
                  invitation.receiverPhone;

                return (
                  <article
                    key={invitation.id}
                    className="rounded-[2rem] border border-white/10 bg-[#101010] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl">
                          👤
                        </div>

                        <h3 className="mt-4 truncate text-lg font-black">
                          {receiverName}
                        </h3>

                        <p className="mt-1 text-sm text-white/45">
                          {invitation.receiverPhone}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyles(
                          invitation.status
                        )}`}
                      >
                        {getStatusLabel(invitation.status)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                      {invitation.status === "PENDING" && (
                        <p className="text-sm text-white/60">
                          Waiting for this person to accept your
                          invitation.
                        </p>
                      )}

                      {invitation.status === "ACCEPTED" && (
                        <p className="text-sm text-emerald-300">
                          This person is now part of your Guardian
                          Network.
                        </p>
                      )}

                      {invitation.status === "REJECTED" && (
                        <p className="text-sm text-red-300">
                          This invitation was declined.
                        </p>
                      )}

                      {invitation.relation && (
                        <p className="mt-2 text-xs text-white/40">
                          Relationship: {invitation.relation}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-white/35">
                        Sent {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InvitationLoadingCard() {
  return (
    <div className="animate-pulse rounded-[2rem] border border-white/10 bg-[#101010] p-5">
      <div className="h-12 w-12 rounded-full bg-white/10" />
      <div className="mt-4 h-5 w-40 rounded bg-white/10" />
      <div className="mt-2 h-4 w-28 rounded bg-white/10" />
      <div className="mt-4 h-20 rounded-2xl bg-white/5" />
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/10 bg-[#101010] px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-2xl">
        🛡️
      </div>

      <h3 className="mt-4 font-black">{title}</h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">
        {description}
      </p>
    </div>
  );
}