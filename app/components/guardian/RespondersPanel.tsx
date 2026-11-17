"use client";

import StatusBadge from "./StatusBadge";

export type GuardianResponder = {
  id: string;
  guardianName: string;
  guardianPhone?: string | null;
  status: string;
  isCurrentlyAuthorized?: boolean;
  viewedAt?: string | null;
  respondingAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type RespondersPanelProps = {
  responders: GuardianResponder[];
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
  responders,
}: RespondersPanelProps) {

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
            {responders.filter(
                (responder) => responder.isCurrentlyAuthorized === true
            ).length}
          </span>
        </div>
      </div>


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

                <div className="flex flex-col items-start gap-2">
                  {responder.isCurrentlyAuthorized === false ? (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                      Former guardian — Historical record
                    </span>
                  ) : null}

                  <StatusBadge status={responder.status} />
                </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {responder.isCurrentlyAuthorized === true &&
                    responder.guardianPhone ? (
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