"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";

export type GuardianResponder = {
  id: string;
  guardianName: string;
  guardianPhone?: string | null;
  status: string;
  viewedAt?: string | null;
  respondingAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type RespondersPanelProps = {
  sessionId: string;
  responders: GuardianResponder[];
};

type RespondResponse = {
  success: boolean;
  error?: string;
  responder?: GuardianResponder;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}

function getLatestActivity(
  responder: GuardianResponder
) {
  const activities = [
    {
      label: "Completed",
      value: responder.completedAt,
    },
    {
      label: "Arrived",
      value: responder.arrivedAt,
    },
    {
      label: "Responding",
      value: responder.respondingAt,
    },
    {
      label: "Viewed",
      value: responder.viewedAt,
    },
    {
      label: "Assigned",
      value: responder.createdAt,
    },
  ];

  const activity = activities.find(
    (item) => item.value
  );

  if (!activity?.value) {
    return null;
  }

  const formatted = formatDateTime(
    activity.value
  );

  return formatted
    ? `${activity.label}: ${formatted}`
    : null;
}

export default function RespondersPanel({
  sessionId,
  responders,
}: RespondersPanelProps) {
  const [submitting, setSubmitting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const handleAction = async () => {
  if (submitting) {
    return;
  }

  setSubmitting(true);
  setSuccessMessage(null);
  setError(null);

  try {
    const respondResponse = await fetch(
      `/api/guardian/session/${sessionId}/respond`,
      {
        method: "POST",
      }
    );

    const respondResult =
      (await respondResponse.json()) as RespondResponse;

    if (respondResponse.ok) {
      setSuccessMessage(
        "You have acknowledged this emergency and are now responding."
      );

      window.location.reload();
      return;
    }

    const mustArrive =
      respondResult.error?.toLowerCase().includes(
        "responding"
      );

    if (!mustArrive) {
      throw new Error(
        respondResult.error ||
          "Unable to update your response."
      );
    }

    const arriveResponse = await fetch(
      `/api/guardian/session/${sessionId}/arrive`,
      {
        method: "POST",
      }
    );

    const arriveResult =
      (await arriveResponse.json()) as RespondResponse;

    if (
      !arriveResponse.ok ||
      !arriveResult.success
    ) {
      throw new Error(
        arriveResult.error ||
          "Unable to confirm your arrival."
      );
    }

    setSuccessMessage(
      "Your arrival has been confirmed."
    );

    window.location.reload();
  } catch (requestError) {
    setError(
      requestError instanceof Error
        ? requestError.message
        : "Unable to update your response."
    );
  } finally {
    setSubmitting(false);
  }
};


  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            Response team
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            Guardian responders
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-white">
            {responders.length}
          </span>

          <button
            type="button"
            onClick={() => {
                void handleAction();
                }}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
            ? "Updating..."
            : "Update Response"}
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
          ✓ {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {responders.length > 0 ? (
          responders.map((responder) => {
            const latestActivity =
              getLatestActivity(responder);

            return (
              <article
                key={responder.id}
                className="rounded-xl border border-white/10 bg-black/30 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-white">
                      {responder.guardianName ||
                        "Unnamed guardian"}
                    </p>

                    {responder.guardianPhone ? (
                      <a
                        href={`tel:${responder.guardianPhone}`}
                        className="mt-1 block text-sm text-white/50 transition hover:text-white"
                      >
                        {responder.guardianPhone}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-white/30">
                        No phone number available
                      </p>
                    )}

                    {latestActivity ? (
                      <p className="mt-3 text-xs text-white/40">
                        {latestActivity}
                      </p>
                    ) : null}
                  </div>

                  <StatusBadge
                    status={responder.status}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {responder.guardianPhone ? (
                    <>
                      <a
                        href={`tel:${responder.guardianPhone}`}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                      >
                        Call
                      </a>

                      <a
                        href={`sms:${responder.guardianPhone}`}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                      >
                        Message
                      </a>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 p-8 text-center">
            <p className="text-sm font-medium text-white/50">
              No responders have been assigned.
            </p>

            <p className="mt-2 text-xs text-white/30">
              Assigned guardians will appear here
              automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}