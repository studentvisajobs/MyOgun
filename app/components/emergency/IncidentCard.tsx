import Link from "next/link";
import StatusBadge from "../ui/StatusBadge";
import Card from "../ui/Card";
import Button from "../ui/Button";
import ResponseActions from "./ResponseActions";

type Props = {
  id: string;
  title: string;
  type: string;
  confidence: number;
  status: string;
  witnesses: number;
  evidence: number;
  area?: string | null;
};

export default function IncidentCard({
  id,
  title,
  type,
  confidence,
  status,
  witnesses,
  evidence,
  area,
}: Props) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            {type.replaceAll("_", " ")}
          </p>

          <h3 className="mt-2 text-2xl font-black">
            {title}
          </h3>

          <p className="mt-2 text-sm text-white/50">
            {area || "Unknown Location"}
          </p>
        </div>

        <StatusBadge label={status} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-white/50">
            Confidence
          </p>

          <p className="mt-2 text-2xl font-black text-emerald-400">
            {confidence}%
          </p>
        </div>

        <div>
          <p className="text-xs text-white/50">
            Witnesses
          </p>

          <p className="mt-2 text-2xl font-black">
            {witnesses}
          </p>
        </div>

        <div>
          <p className="text-xs text-white/50">
            Evidence
          </p>

          <p className="mt-2 text-2xl font-black">
            {evidence}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Button
          href={`/incidents/${id}`}
          className="w-full"
        >
          Open Incident
        </Button>
        <ResponseActions incidentId={id} />
      </div>
    </Card>
  );
}