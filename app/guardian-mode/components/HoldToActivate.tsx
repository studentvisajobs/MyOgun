"use client";

import { useRef, useState } from "react";

type HoldToActivateProps = {
  active: boolean;
  onActivate: () => void;
  onStop: () => void;
};

export default function HoldToActivate({
  active,
  onActivate,
  onStop,
}: HoldToActivateProps) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activatedRef = useRef(false);

  function clearHoldTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startHold() {
    if (active || intervalRef.current) return;

    activatedRef.current = false;
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 4;

        if (next >= 100 && !activatedRef.current) {
          activatedRef.current = true;
          clearHoldTimer();

          setTimeout(() => {
            onActivate();
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
      setProgress(0);
    }
  }

  if (active) {
    return (
      <button
        onClick={onStop}
        className="mt-6 w-full rounded-full bg-red-600 py-4 text-lg font-black text-white"
      >
        Stop Guardian
      </button>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        className="w-full rounded-full bg-emerald-500 py-4 text-lg font-black text-black"
      >
        Hold to Activate
      </button>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-center text-xs text-white/50">
        Hold for 3 seconds. Release to cancel.
      </p>
    </div>
  );
}