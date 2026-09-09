"use client";


import { useEffect, useRef, useState } from "react";
import ResponderStatus from "./components/ResponderStatus";

import { EmergencyEngine } from "@/lib/emergency/EmergencyEngine";
import type {
  EmergencyLocation,
  EmergencyStatus,
  EmergencyTimelineItem,
} from "@/lib/emergency/EmergencyTypes";
import { EvidenceEngine } from "@/lib/evidence/EvidenceEngine";

export default function SilentSOSClient() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startedAt, setStartedAt] =
  useState<string | null>(null);
  const [status, setStatus] = useState<EmergencyStatus>("READY");
  const [battery, setBattery] = useState<number | null>(null);
  const [location, setLocation] = useState<EmergencyLocation | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<EmergencyTimelineItem[]>([]);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(true);


  const [responders, setResponders] = useState<
    {
      id: string;
      guardianName: string;
      guardianPhone: string;
      status: string;
    }[]
  >([]);

  const engineRef = useRef<EmergencyEngine | null>(null);
  const evidenceRef = useRef<EvidenceEngine | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activatedRef = useRef(false);

  useEffect(() => {
    setTimeline([
      {
        time: new Date().toLocaleTimeString(),
        message: "Silent SOS ready.",
      },
    ]);

    evidenceRef.current = new EvidenceEngine();

    engineRef.current = new EmergencyEngine({
      mode: "SOS",
      onTimeline: (item) => setTimeline((old) => [item, ...old]),
      onLocation: (loc) => setLocation(loc),
      onBattery: (level) => setBattery(level),
      onStartedAt: (value) => {
      setStartedAt(value);
      },
      onSession: async (id) => {
        setSessionId(id);

        if (id) {
          try {
            await evidenceRef.current?.createEvidence({
              sessionId: id,
              mode: "SOS",
              type: "LOCATION",
              latitude: location?.latitude ?? null,
              longitude: location?.longitude ?? null,
              accuracy: location?.accuracy ?? null,
              batteryLevel: battery,
              networkStatus: navigator.onLine ? "ONLINE" : "OFFLINE",
            });

            setTimeline((old) => [
              {
                time: new Date().toLocaleTimeString(),
                message: "Initial SOS location evidence saved.",
              },
              ...old,
            ]);
          } catch {
            setTimeline((old) => [
              {
                time: new Date().toLocaleTimeString(),
                message: "Evidence queued for later upload.",
              },
              ...old,
            ]);
          }
        }
      },
      onStatus: (newStatus) => {
        setStatus(newStatus);
        setActive(newStatus === "ACTIVE");
      },
    });

    void engineRef.current.resume();

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

 useEffect(() => {
  if (!active || !startedAt) {
    return;
  }

  const updateTimer = () => {
    const startTime =
      new Date(startedAt).getTime();

    if (Number.isNaN(startTime)) {
      return;
    }

    const elapsed = Math.floor(
      (Date.now() - startTime) / 1000
    );

    setSeconds(Math.max(0, elapsed));
  };

  updateTimer();

  const timer = setInterval(
    updateTimer,
    1000
  );

  return () => {
    clearInterval(timer);
  };
  }, [active, startedAt]);


  useEffect(() => {
  const updateNetworkStatus = () => {
    setIsOnline(navigator.onLine);
  };

  updateNetworkStatus();

  window.addEventListener(
    "online",
    updateNetworkStatus
  );

  window.addEventListener(
    "offline",
    updateNetworkStatus
  );

  return () => {
    window.removeEventListener(
      "online",
      updateNetworkStatus
    );

    window.removeEventListener(
      "offline",
      updateNetworkStatus
    );
  };
}, []);


  useEffect(() => {
    if (!sessionId) return;

    const fetchResponders = async () => {
      try {
        const res = await fetch(
          `/api/guardian/responders?sessionId=${sessionId}`
        );

        if (!res.ok) return;

        const data = await res.json();

        setResponders(data.responders);
      } catch (err) {
        console.error(err);
      }
    };

    fetchResponders();

    const interval = setInterval(fetchResponders, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const loadTimeline = async () => {
      try {
        const res = await fetch(
          `/api/guardian/timeline?sessionId=${sessionId}`
        );

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        setTimeline(
          data.timeline.map(
            (item: {
              createdAt: string;
              message: string;
            }) => ({
              time: new Date(
                item.createdAt
              ).toLocaleTimeString(),
              message: item.message,
            })
          )
        );
      } catch (error) {
        console.error(
          "Timeline restore error:",
          error
        );
      }
    };

    void loadTimeline();
  }, [sessionId]);

  function formatTime(sec: number) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function startHold() {
    if (active || holdTimerRef.current) return;

    activatedRef.current = false;
    setHoldProgress(0);

    holdTimerRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        const next = prev + 4;

        if (next >= 100 && !activatedRef.current) {
          activatedRef.current = true;
          clearHoldTimer();

          setTimeout(async () => {
            setSeconds(0);
            setStartedAt(null);
            await engineRef.current?.start();
          }, 0);

          return 100;
        }

        return next;
      });
    }, 100);
  }

  function cancelHold() {
    clearHoldTimer();

    if (!active && !activatedRef.current) {
      setHoldProgress(0);
    }
  }

function sendOfflineEmergencySMS() {
  if (!location) {
    setTimeline((old) => [
      {
        time: new Date().toLocaleTimeString(),
        message:
          "Waiting for GPS before preparing emergency SMS.",
      },
      ...old,
    ]);

    return;
  }

  const guardian =
    responders.find(
      (responder) =>
        Boolean(responder.guardianPhone)
    );

  if (!guardian) {
    setTimeline((old) => [
      {
        time: new Date().toLocaleTimeString(),
        message:
          "No guardian phone number is available for emergency SMS.",
      },
      ...old,
    ]);

    return;
  }

  const lat =
    location.latitude.toFixed(6);

  const lng =
    location.longitude.toFixed(6);

  const mapsLink =
    `https://maps.google.com/?q=${lat},${lng}`;

  const message = [
    "🚨 MYOGUN EMERGENCY",
    "",
    "I may be in danger and I currently have no internet connection.",
    "",
    `My last known location: ${lat}, ${lng}`,
    mapsLink,
    "",
    "Please contact me or get help immediately.",
  ].join("\n");

  const phone =
    guardian.guardianPhone.replace(
      /[^\d+]/g,
      ""
    );

  window.location.href =
    `sms:${phone}?body=${encodeURIComponent(
      message
    )}`;
}


  async function stopSOS() {
    if (!engineRef.current) {
      return;
    }

    try {
      await engineRef.current.stop();

      setSeconds(0);
      setStartedAt(null);
      setHoldProgress(0);
      setSessionId(null);
      setResponders([]);
    } catch (error) {
      console.error("Stop SOS error:", error);

      setTimeline((old) => [
        {
          time: new Date().toLocaleTimeString(),
          message: "Unable to stop SOS. Please try again.",
        },
        ...old,
      ]);
    }
  }

  return (
  <>
    <section className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-center shadow-2xl">
      <div
        className={`mx-auto flex h-56 w-56 items-center justify-center rounded-full border ${
          active
            ? "animate-pulse border-red-500 bg-red-500/30"
            : "border-red-500 bg-red-500/10"
        }`}
      >
        <div>
          <p className="text-6xl">🚨</p>

          <p className="mt-4 text-2xl font-black">
            {active ? "LIVE" : "READY"}
          </p>

          <p className="mt-2 text-white/60">
            {active ? formatTime(seconds) : "Hold below"}
          </p>
        </div>
      </div>

      {!active ? (
        <div className="mt-8">
          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className="w-full rounded-full bg-red-600 py-4 text-lg font-black text-white"
          >
            Hold to Activate SOS
          </button>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${holdProgress}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-white/50">
            Release before completion to cancel.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            void stopSOS();
          }}
          className="mt-8 w-full rounded-full bg-white py-4 text-lg font-black text-black"
        >
          Stop SOS
        </button>
      )}
    </section>

    <section className="mt-6 rounded-[2rem] border border-red-500/20 bg-[#111] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black tracking-[0.25em] text-red-300">
            EMERGENCY ENGINE
          </p>

          <h2 className="mt-2 text-3xl font-black">
            SOS Command
          </h2>
        </div>

        <span className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-black text-red-300">
          {status}
        </span>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60">Mode</span>
          <strong>SOS</strong>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-white/60">Session</span>
          <strong>{sessionId ? "Saved ✅" : "Not Started"}</strong>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-2xl">📍</p>

          <p className="mt-3 text-sm text-white/50">
            GPS
          </p>

          <p className="mt-1 font-black">
            {location ? "Connected" : "Waiting"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
          <p className="text-2xl">🔋</p>

          <p className="mt-3 text-sm text-white/50">
            Battery
          </p>

          <p className="mt-1 font-black">
            {battery !== null ? `${battery}%` : "--"}
          </p>
        </div>
      </div>

      {location && (
        <div className="mt-4 rounded-3xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
          <p>Latitude: {location.latitude.toFixed(6)}</p>

          <p className="mt-1">
            Longitude: {location.longitude.toFixed(6)}
          </p>

          <p className="mt-1">
            Accuracy:{" "}
            {location.accuracy ? `${Math.round(location.accuracy)}m` : "--"}
          </p>
        </div>
      )}
    </section>

    {active && !isOnline && (
  <section className="mt-6 rounded-[2rem] border border-orange-500/40 bg-orange-500/10 p-5">
    <div className="flex items-start gap-3">
      <span className="text-3xl">📵</span>

      <div>
        <p className="text-xs font-black tracking-[0.2em] text-orange-300">
          OFFLINE EMERGENCY MODE
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Internet connection unavailable
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/70">
          MyOgun is continuing to track your location
          on this device. Your emergency will synchronise
          automatically when internet returns.
        </p>
      </div>
    </div>

    {location && (
      <div className="mt-4 rounded-2xl bg-black/30 p-4">
        <p className="text-xs text-white/50">
          LAST KNOWN LOCATION
        </p>

        <p className="mt-1 font-bold text-white">
          {location.latitude.toFixed(6)},{" "}
          {location.longitude.toFixed(6)}
        </p>

        {location.accuracy && (
          <p className="mt-1 text-xs text-white/50">
            Accuracy approximately{" "}
            {Math.round(location.accuracy)}m
          </p>
        )}
      </div>
    )}

    <button
      type="button"
      onClick={sendOfflineEmergencySMS}
      disabled={!location}
      className="mt-4 w-full rounded-full bg-orange-500 px-5 py-4 font-black text-black disabled:opacity-40"
    >
      📱 Send Emergency SMS
    </button>

    <p className="mt-3 text-center text-xs text-white/50">
      Opens your phone&apos;s messaging app with your
      emergency location ready to send.
    </p>
  </section>
)}

    <ResponderStatus responders={responders} />

    <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#111] p-5">
      <h2 className="text-xl font-black">
        SOS Timeline
      </h2>

      <div className="mt-4 space-y-4">
        {timeline.map((item, index) => (
          <div
            key={index}
            className="border-l border-red-500/50 pl-4"
          >
            <p className="text-xs font-bold text-red-300">
              {item.time}
            </p>

            <p className="mt-1 text-sm text-white/70">
              {item.message}
            </p>
          </div>
        ))}
      </div>
    </section>
  </>
);
}