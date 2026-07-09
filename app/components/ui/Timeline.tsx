type TimelineItem = {
  title: string;
  description?: string;
  time: string;
  colour?: "emerald" | "red" | "yellow" | "blue";
};

type Props = {
  items: TimelineItem[];
};

export default function Timeline({ items }: Props) {
  const colours = {
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    blue: "bg-sky-500",
  };

  if (items.length === 0) {
    return <p className="text-sm text-white/50">No timeline activity yet.</p>;
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="flex gap-5">
          <div className="flex flex-col items-center">
            <div
              className={`h-4 w-4 rounded-full ${
                colours[item.colour || "emerald"]
              }`}
            />

            {index !== items.length - 1 && (
              <div className="mt-1 h-full w-px bg-white/10" />
            )}
          </div>

          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-black">{item.title}</h3>

              <span className="shrink-0 text-xs text-white/40">
                {item.time}
              </span>
            </div>

            {item.description && (
              <p className="mt-2 text-sm text-white/60">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}