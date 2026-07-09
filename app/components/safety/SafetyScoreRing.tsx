type Props = {
  score: number;
};

export default function SafetyScoreRing({ score }: Props) {
  const color =
    score >= 85
      ? "#10B981"
      : score >= 70
      ? "#FACC15"
      : "#EF4444";

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg
        className="-rotate-90"
        width="112"
        height="112"
      >
        <circle
          cx="56"
          cy="56"
          r="46"
          stroke="#1f2937"
          strokeWidth="8"
          fill="none"
        />

        <circle
          cx="56"
          cy="56"
          r="46"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={289}
          strokeDashoffset={289 - (289 * score) / 100}
        />
      </svg>

      <div className="absolute text-center">
        <div
          className="text-3xl font-black"
          style={{ color }}
        >
          {score}
        </div>

        <div className="text-[11px] uppercase tracking-widest text-white/50">
          Score
        </div>
      </div>
    </div>
  );
}