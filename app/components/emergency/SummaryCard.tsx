import Card from "../ui/Card";

type Props = {
  title: string;
  value: number;
  colour?: "emerald" | "red" | "yellow" | "blue";
};

export default function SummaryCard({
  title,
  value,
  colour = "emerald",
}: Props) {
  const colours = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    blue: "text-sky-400",
  };

  return (
    <Card className="p-6">
      <p className="text-sm text-white/50">
        {title}
      </p>

      <p className={`mt-3 text-5xl font-black ${colours[colour]}`}>
        {value}
      </p>
    </Card>
  );
}