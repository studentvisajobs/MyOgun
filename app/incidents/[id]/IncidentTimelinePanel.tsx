import Card from "../../components/ui/Card";
import Timeline from "../../components/ui/Timeline";
import type { Evidence, Confirmation, IncidentUpdate } from "@/app/generated/prisma/client";

type Props = {
  createdAt: Date;
  evidence: Evidence[];
  confirmations: Confirmation[];
  updates: IncidentUpdate[];
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IncidentTimelinePanel({
  createdAt,
  evidence,
  confirmations,
  updates,
}: Props) {
  const items = [
    {
      title: "Incident Reported",
      description: "The report was submitted to MyOgun Community Intelligence.",
      time: formatTime(createdAt),
      colour: "emerald" as const,
    },

    ...evidence.map((item) => ({
      title: `${item.type} Evidence Uploaded`,
      description: "Evidence was attached to this incident.",
      time: formatTime(item.createdAt),
      colour: "blue" as const,
    })),

    ...confirmations.map((item) => ({
      title:
        item.vote === "CONFIRM"
          ? "Community Witness Confirmed"
          : "Report Disputed",
      description: item.comment || "No comment added.",
      time: formatTime(item.createdAt),
      colour: item.vote === "CONFIRM" ? ("emerald" as const) : ("red" as const),
    })),

    ...updates.map((item) => ({
      title: "Incident Update",
      description: item.message,
      time: formatTime(item.createdAt),
      colour: "yellow" as const,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card className="mt-8">
      <h2 className="text-2xl font-black">🕒 Incident Timeline</h2>

      <div className="mt-6">
        <Timeline items={items} />
      </div>
    </Card>
  );
}