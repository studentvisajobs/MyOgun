"use client";

import { useRef, useState } from "react";

type TimelineItem = {
  message: string;
  createdAt: string;
};

export default function JourneyClient() {
  const [destination, setDestination] = useState("");
  const [active, setActive] = useState(false);
  const [journeyId, setJourneyId] = useState("");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [status, setStatus] = useState("READY");
  const watchRef = useRef<number | null>(null);

  async function startJourney() {
    if (!destination.trim()) {
      alert("Please enter your destination.");
      return;
    }

    setStatus("STARTING");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const res = await fetch("/api/journey/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Unable to start journey.");
          setStatus("READY");
          return;
        }

        setJourneyId(data.journey.id);
        setActive(true);
        setStatus("ACTIVE");
        setTimeline(data.journey.timeline || []);

        watchRef.current = navigator.geolocation.watchPosition((pos) => {
          fetch("/api/journey/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              journeyId: data.journey.id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
        });
      },
      () => {
        alert("Location permission is required.");
        setStatus("READY");
      }
    );
  }

  async function checkIn() {
    if (!journeyId) return;

    const res = await fetch("/api/journey/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journeyId }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("CHECKED IN");
      setTimeline(data.journey.timeline || []);
    }
  }

  async function stopJourney() {
    if (!journeyId) return;

    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    const res = await fetch("/api/journey/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journeyId }),
    });

    const data = await res.json();

    if (res.ok) {
      setTimeline(data.journey.timeline || []);
      setActive(false);
      setJourneyId("");
      setStatus("COMPLETED");
    }
  }

  return (
    <>
      <section className="rounded-[2rem] border border-white/10 bg-[#111] p-6">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          disabled={active}
          placeholder="Where are you going?"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none focus:border-emerald-500 disabled:opacity-50"
        />

        <div className="mt-5 rounded-2xl bg-black/30 p-4">
          <p className="text-xs text-white/50">Status</p>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            {status}
          </p>
        </div>

        {!active ? (
          <button
            onClick={startJourney}
            className="mt-6 w-full rounded-full bg-emerald-500 py-4 font-black text-black"
          >
            Start Journey
          </button>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={checkIn}
              className="rounded-full bg-blue-500 py-4 font-black text-white"
            >
              I'm Safe
            </button>

            <button
              onClick={stopJourney}
              className="rounded-full bg-red-500 py-4 font-black text-white"
            >
              End Journey
            </button>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111] p-6">
        <h2 className="text-2xl font-black">Journey Timeline</h2>

        <div className="mt-5 space-y-4">
          {timeline.length === 0 ? (
            <p className="text-white/50">
              No journey started yet. Start a journey and MyOgun will monitor
              your safety until you arrive.
            </p>
          ) : (
            timeline.map((item, index) => (
              <div key={index} className="border-l border-emerald-500/40 pl-4">
                <p className="text-sm text-white/70">{item.message}</p>
                <p className="mt-1 text-xs text-white/40">
                  {new Date(item.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}