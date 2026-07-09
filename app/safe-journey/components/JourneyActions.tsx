type Props = {
  active: boolean;
  onStart: () => void;
  onCheckIn: () => void;
  onStop: () => void;
};

export default function JourneyActions({
  active,
  onStart,
  onCheckIn,
  onStop,
}: Props) {
  if (!active) {
    return (
      <button
        onClick={onStart}
        className="mt-6 w-full rounded-full bg-emerald-500 py-4 text-lg font-black text-black"
      >
        🚗 Start Journey
      </button>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
      <button
        onClick={onCheckIn}
        className="rounded-full bg-blue-500 py-4 font-black text-white"
      >
        ✅ Check In
      </button>

      <button
        onClick={onStop}
        className="rounded-full bg-red-500 py-4 font-black text-white"
      >
        ⛔ End Journey
      </button>
    </div>
  );
}