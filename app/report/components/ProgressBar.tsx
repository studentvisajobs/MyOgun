import type { ReportStep } from "../types";

const steps: ReportStep[] = [
  "TYPE",
  "DETAILS",
  "EVIDENCE",
  "LOCATION",
  "REVIEW",
  "SUCCESS",
];

export default function ProgressBar({ step }: { step: ReportStep }) {
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="mt-6">
      <div className="flex justify-between text-xs font-bold text-white/40">
        <span>Report</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}