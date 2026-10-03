"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import GuardianStatus from "./components/GuardianStatus";
import HoldToActivate from "./components/HoldToActivate";
import GuardianTimeline from "./components/GuardianTimeline";
import { GuardianEngine } from "@/lib/guardian/GuardianEngine";

type TimelineItem = {
  time: string;
  message: string;
};

type ActiveSession = {
  id: string;
  status: string;
  createdAt?: string;
  startedAt?: string;
};

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateElapsedSeconds(
  session: ActiveSession
) {
  const startedAt =
    session.startedAt ??
    session.createdAt;

  if (!startedAt) {
    return 0;
  }

  const started =
    new Date(startedAt).getTime();

  if (!Number.isFinite(started)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - started) / 1000
    )
  );
}

export default function GuardianModeClient() {
  const [active, setActive] =
    useState(false);

  const [seconds, setSeconds] =
    useState(0);

  const [items, setItems] =
    useState<TimelineItem[]>([
      {
        time: nowTime(),
        message: "Guardian Mode Ready",
      },
    ]);

  const [restoring, setRestoring] =
    useState(true);

  const engineRef =
    useRef<GuardianEngine | null>(null);

  const startedAtRef =
    useRef<number | null>(null);

  function addTimeline(
    item: TimelineItem
  ) {
    setItems((previous) => [
      item,
      ...previous,
    ]);
  }

  function createEngine() {
    const engine = new GuardianEngine({
      onTimeline: (item) => {
        addTimeline(item);
      },

      onLocation: () => {
        // Location is continuously handled
        // by GuardianEngine.
      },

      onStatus: (status) => {
        if (status === "ACTIVE") {
          setActive(true);

          if (
            startedAtRef.current === null
          ) {
            startedAtRef.current =
              Date.now();
          }

          return;
        }

        if (
          status === "STOPPED" ||
          status === "ERROR"
        ) {
          setActive(false);
        }
      },

      onBattery: () => {
        // Battery updates are persisted
        // by GuardianEngine.
      },

      onSession: () => {
        // Session ownership remains
        // inside GuardianEngine.
      },
    });

    engineRef.current = engine;

    return engine;
  }

  useEffect(() => {
    let cancelled = false;

    const engine = createEngine();

    async function restoreSession() {
      try {
        const response = await fetch(
          "/api/guardian/active",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as {
            success?: boolean;
            session?: ActiveSession | null;
            error?: string;
          };

        if (
          cancelled ||
          !response.ok ||
          !data.session
        ) {
          return;
        }

        const elapsed =
          calculateElapsedSeconds(
            data.session
          );

        setSeconds(elapsed);

        startedAtRef.current =
          Date.now() - elapsed * 1000;

        addTimeline({
          time: nowTime(),
          message:
            "Active Guardian session found. Restoring protection.",
        });

        await engine.resume(
          data.session.id
        );
      } catch (error) {
        if (!cancelled) {
          addTimeline({
            time: nowTime(),
            message:
              error instanceof Error
                ? `Unable to restore Guardian session: ${error.message}`
                : "Unable to restore Guardian session.",
          });
        }
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
      engine.dispose();

      if (
        engineRef.current === engine
      ) {
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }

    const updateTimer = () => {
      if (
        startedAtRef.current === null
      ) {
        return;
      }

      setSeconds(
        Math.max(
          0,
          Math.floor(
            (Date.now() -
              startedAtRef.current) /
              1000
          )
        )
      );
    };

    updateTimer();

    const timer = window.setInterval(
      updateTimer,
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [active]);

  async function activate() {
    if (
      restoring ||
      active ||
      engineRef.current === null
    ) {
      return;
    }

    setItems([
      {
        time: nowTime(),
        message:
          "Guardian Mode activation requested.",
      },
    ]);

    setSeconds(0);

    startedAtRef.current =
      Date.now();

    await engineRef.current.start();
  }

  async function stop() {
    if (
      !engineRef.current ||
      !active
    ) {
      return;
    }

    try {
      await engineRef.current.stop();

      setActive(false);
      setSeconds(0);
      startedAtRef.current = null;

      addTimeline({
        time: nowTime(),
        message:
          "Guardian Mode Ended Safely",
      });
    } catch (error) {
      addTimeline({
        time: nowTime(),
        message:
          error instanceof Error
            ? `Unable to stop Guardian Mode: ${error.message}`
            : "Unable to stop Guardian Mode.",
      });
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        {restoring && (
          <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            Checking for an active Guardian
            session...
          </div>
        )}

        <GuardianStatus
          active={active}
          seconds={seconds}
        />

        <HoldToActivate
          active={active}
          onActivate={() => {
            void activate();
          }}
          onStop={() => {
            void stop();
          }}
        />

        <GuardianTimeline
          items={items}
        />
      </div>
    </main>
  );
}