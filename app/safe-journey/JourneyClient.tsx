"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type TimelineItem = {
  id?: string;
  message: string;
  createdAt: string;
};

type ActiveJourney = {
  id: string;
  destination: string;
  estimatedArrival: string | null;
  status: string;
  timeline?: TimelineItem[];
};

type BatteryManager = {
  level: number;
};

type NavigatorWithConnection = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
  connection?: {
    effectiveType?: string;
    type?: string;
  };
};

function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  return new Date(
    date.getTime() - offset * 60_000
  )
    .toISOString()
    .slice(0, 16);
}

export default function JourneyClient() {
  const [destination, setDestination] = useState("");
  const [estimatedArrival, setEstimatedArrival] =
    useState("");

  const [active, setActive] = useState(false);
  const [journeyId, setJourneyId] = useState("");
  const [timeline, setTimeline] = useState<
    TimelineItem[]
  >([]);

  const [status, setStatus] = useState("READY");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(true);

  const watchRef = useRef<number | null>(null);
  const lastUploadRef = useRef(0);

  const getDeviceStatus = useCallback(async () => {
    const extendedNavigator =
      navigator as NavigatorWithConnection;

    let batteryLevel: number | null = null;

    if (extendedNavigator.getBattery) {
      try {
        const battery =
          await extendedNavigator.getBattery();

        batteryLevel = Math.round(
          battery.level * 100
        );
      } catch {
        batteryLevel = null;
      }
    }

    const networkStatus =
      extendedNavigator.connection?.effectiveType ||
      extendedNavigator.connection?.type ||
      (navigator.onLine ? "ONLINE" : "OFFLINE");

    return {
      batteryLevel,
      networkStatus,
    };
  }, []);

  const beginLocationTracking = useCallback(
    (id: string) => {
      if (!navigator.geolocation) {
        setMessage(
          "GPS is not available on this device."
        );
        return;
      }

      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchRef.current
        );
      }

      lastUploadRef.current = 0;

      watchRef.current =
        navigator.geolocation.watchPosition(
          async (position) => {
            const now = Date.now();

            if (
              now - lastUploadRef.current <
              10000
            ) {
              return;
            }

            lastUploadRef.current = now;

            try {
              const deviceStatus =
                await getDeviceStatus();

              const response = await fetch(
                "/api/journey/update",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    journeyId: id,
                    latitude:
                      position.coords.latitude,
                    longitude:
                      position.coords.longitude,
                    accuracy:
                      position.coords.accuracy,
                    batteryLevel:
                      deviceStatus.batteryLevel,
                    networkStatus:
                      deviceStatus.networkStatus,
                  }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                setMessage(
                  data.error ||
                    "Unable to update journey location."
                );
                return;
              }

              setMessage(
                "Journey location updated for your guardians."
              );
            } catch {
              setMessage(
                "Unable to update your live journey location."
              );
            }
          },
          () => {
            setMessage(
              "Location permission is required for live journey monitoring."
            );
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 15000,
          }
        );
    },
    [getDeviceStatus]
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreActiveJourney() {
      try {
        const response = await fetch(
          "/api/journey/active",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status !== 401) {
            setMessage(
              data.error ||
                "Unable to restore your active journey."
            );
          }

          return;
        }

        const journey =
          data.journey as ActiveJourney | null;

        if (!journey || cancelled) {
          return;
        }

        setJourneyId(journey.id);
        setDestination(journey.destination);
        setEstimatedArrival(
          formatDateTimeLocal(
            journey.estimatedArrival
          )
        );
        setStatus(journey.status);
        setTimeline(journey.timeline || []);
        setActive(true);

        beginLocationTracking(journey.id);

        setMessage(
          "Your active Safe Journey has been restored. Live monitoring has resumed."
        );
      } catch {
        if (!cancelled) {
          setMessage(
            "Unable to restore your active journey."
          );
        }
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    }

    void restoreActiveJourney();

    return () => {
      cancelled = true;

      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchRef.current
        );

        watchRef.current = null;
      }
    };
  }, [beginLocationTracking]);

  async function startJourney() {
    const cleanDestination = destination.trim();

    if (!cleanDestination) {
      setMessage(
        "Please enter your destination."
      );
      return;
    }

    if (!navigator.geolocation) {
      setMessage(
        "GPS is not available on this device."
      );
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setStatus("STARTING");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const deviceStatus =
              await getDeviceStatus();

            const response = await fetch(
              "/api/journey/start",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  destination: cleanDestination,
                  estimatedArrival:
                    estimatedArrival || null,
                  latitude:
                    position.coords.latitude,
                  longitude:
                    position.coords.longitude,
                  accuracy:
                    position.coords.accuracy,
                  batteryLevel:
                    deviceStatus.batteryLevel,
                  networkStatus:
                    deviceStatus.networkStatus,
                }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Unable to start journey."
              );
            }

            const id =
              data.journey.id as string;

            setJourneyId(id);
            setActive(true);
            setStatus(
              data.journey.status || "ACTIVE"
            );
            setTimeline(
              data.journey.timeline || []
            );

            beginLocationTracking(id);

            setMessage(
              "Safe Journey started. Your Guardian Network can now monitor your progress."
            );
          } catch (error) {
            setStatus("READY");

            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to start journey."
            );
          } finally {
            setSubmitting(false);
          }
        },
        () => {
          setMessage(
            "Location permission is required."
          );
          setStatus("READY");
          setSubmitting(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    } catch {
      setStatus("READY");
      setSubmitting(false);
      setMessage(
        "Unable to start journey."
      );
    }
  }

  async function checkIn() {
    if (!journeyId) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch(
        "/api/journey/checkin",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            journeyId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to check in."
        );
      }

      setStatus(
        data.journey.status || "CHECKED_IN"
      );
      setTimeline(
        data.journey.timeline || []
      );
      setMessage(
        "Check-in recorded. Your guardians can see that you are safe."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to check in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function stopJourney() {
    if (!journeyId) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch(
        "/api/journey/stop",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            journeyId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to end journey."
        );
      }

      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchRef.current
        );

        watchRef.current = null;
      }

      setTimeline(
        data.journey.timeline || []
      );
      setActive(false);
      setJourneyId("");
      setStatus("COMPLETED");
      setMessage(
        "Journey completed. Your guardians can see that you arrived safely."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to end journey."
      );
    } finally {
      setSubmitting(false);
    }
  }

async function extendJourney(
  minutes: 15 | 30 | 60
) {
  if (!journeyId) {
    return;
  }

  try {
    setSubmitting(true);
    setMessage("");

    const response = await fetch(
      "/api/journey/extend",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          journeyId,
          minutes,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to extend journey."
      );
    }

    setStatus(
      data.journey.status
    );

    setTimeline(
      data.journey.timeline || []
    );

    setEstimatedArrival(
      formatDateTimeLocal(
        data.journey.estimatedArrival
      )
    );

    setMessage(
      `Journey extended by ${minutes} minutes.`
    );
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to extend journey."
    );
  } finally {
    setSubmitting(false);
  }
}

  return (
    <>
      <section className="rounded-[2rem] border border-white/10 bg-[#111] p-6">
        <div>
          <label
            htmlFor="journey-destination"
            className="text-sm font-bold text-white/75"
          >
            Destination
          </label>

          <input
            id="journey-destination"
            value={destination}
            onChange={(event) =>
              setDestination(
                event.target.value
              )
            }
            disabled={
              active ||
              submitting ||
              restoring
            }
            placeholder="Where are you going?"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="journey-eta"
            className="text-sm font-bold text-white/75"
          >
            Estimated arrival
            <span className="ml-2 font-normal text-white/40">
              Optional
            </span>
          </label>

          <input
            id="journey-eta"
            type="datetime-local"
            value={estimatedArrival}
            onChange={(event) =>
              setEstimatedArrival(
                event.target.value
              )
            }
            disabled={
              active ||
              submitting ||
              restoring
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <div className="mt-5 rounded-2xl bg-black/30 p-4">
          <p className="text-xs text-white/50">
            Status
          </p>

          <p className="mt-2 text-2xl font-black text-emerald-400">
            {restoring
              ? "RESTORING"
              : status.replaceAll(
                  "_",
                  " "
                )}
          </p>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/65">
            {message}
          </div>
        )}

{!active ? (
  <button
    type="button"
    onClick={() =>
      void startJourney()
    }
    disabled={
      submitting || restoring
    }
    className="mt-6 w-full rounded-full bg-emerald-500 py-4 font-black text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {restoring
      ? "Checking Active Journey..."
      : submitting
        ? "Starting Journey..."
        : "Start Journey"}
  </button>
) : status === "OVERDUE" ? (
  <div className="mt-6 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6">
    <h3 className="text-2xl font-black text-yellow-400">
      Journey Overdue
    </h3>

    <p className="mt-3 text-white/70">
      Your estimated arrival time has passed.
      Have you arrived safely?
    </p>

    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={() =>
          void stopJourney()
        }
        disabled={submitting}
        className="w-full rounded-full bg-emerald-500 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Completing Journey..."
          : "Yes, I've Arrived"}
      </button>

<div className="grid grid-cols-3 gap-2">
  <button
    type="button"
    onClick={() =>
      void extendJourney(15)
    }
    disabled={submitting}
    className="rounded-full bg-yellow-500 py-3 text-sm font-black text-black"
  >
    +15 min
  </button>

  <button
    type="button"
    onClick={() =>
      void extendJourney(30)
    }
    disabled={submitting}
    className="rounded-full bg-yellow-500 py-3 text-sm font-black text-black"
  >
    +30 min
  </button>

  <button
    type="button"
    onClick={() =>
      void extendJourney(60)
    }
    disabled={submitting}
    className="rounded-full bg-yellow-500 py-3 text-sm font-black text-black"
  >
    +60 min
  </button>
</div>

    </div>
  </div>
) : (
  <div className="mt-6 grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() =>
        void checkIn()
      }
      disabled={submitting}
      className="rounded-full bg-blue-500 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      I&apos;m Safe
    </button>

    <button
      type="button"
      onClick={() =>
        void stopJourney()
      }
      disabled={submitting}
      className="rounded-full bg-red-500 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      End Journey
    </button>
  </div>
)}
      
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111] p-6">
        <h2 className="text-2xl font-black">
          Journey Timeline
        </h2>

        <div className="mt-5 space-y-4">
          {timeline.length === 0 ? (
            <p className="text-white/50">
              No journey started yet. Start a
              journey and MyOgun will monitor
              your safety until you arrive.
            </p>
          ) : (
            timeline.map(
              (item, index) => (
                <div
                  key={
                    item.id ||
                    `${item.createdAt}-${index}`
                  }
                  className="border-l border-emerald-500/40 pl-4"
                >
                  <p className="text-sm text-white/70">
                    {item.message}
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {new Date(
                      item.createdAt
                    ).toLocaleTimeString(
                      "en-GB"
                    )}
                  </p>
                </div>
              )
            )
          )}
        </div>
      </section>
    </>
  );
}