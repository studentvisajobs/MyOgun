"use client";

import { useEffect, useState } from "react";
import GuardianStatus from "./components/GuardianStatus";
import HoldToActivate from "./components/HoldToActivate";
import GuardianTimeline from "./components/GuardianTimeline";

type TimelineItem = {
  time: string;
  message: string;
};

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GuardianModeClient() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [items, setItems] = useState<TimelineItem[]>([
    {
      time: nowTime(),
      message: "Guardian Mode Ready",
    },
  ]);

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [active]);

  function activate() {
    setActive(true);
    setSeconds(0);

    setItems([
      {
        time: nowTime(),
        message: "Guardian Mode Activated",
      },
      {
        time: nowTime(),
        message: "GPS Tracking Started",
      },
      {
        time: nowTime(),
        message: "Emergency Session Created",
      },
      {
        time: nowTime(),
        message: "Live Monitoring Started",
      },
    ]);
  }

  function stop() {
    setActive(false);

    setItems((prev) => [
      {
        time: nowTime(),
        message: "Guardian Mode Ended Safely",
      },
      ...prev,
    ]);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <GuardianStatus active={active} seconds={seconds} />

        <HoldToActivate
          active={active}
          onActivate={activate}
          onStop={stop}
        />

        <GuardianTimeline items={items} />
      </div>
    </main>
  );
}