type Responder = {
  id: string;
  guardianName: string;
  status: string;
};

type Props = {
  responders: Responder[];
};

const statusColor: Record<string, string> = {
  NOTIFIED: "bg-yellow-500/20 text-yellow-300",
  VIEWED: "bg-blue-500/20 text-blue-300",
  RESPONDING: "bg-emerald-500/20 text-emerald-300",
  ARRIVED: "bg-purple-500/20 text-purple-300",
  COMPLETED: "bg-white/20 text-white",
};

export default function ResponderStatus({ responders }: Props) {
  return (
    <section className="mt-6 rounded-[2rem] border border-red-500/20 bg-[#111] p-5">
      <h2 className="text-xl font-black">Guardian Response</h2>

      {responders.length === 0 ? (
        <p className="mt-4 text-white/50">
          Waiting for guardian notifications...
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {responders.map((guardian) => (
            <div
              key={guardian.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <div>
                <p className="font-bold">{guardian.guardianName}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  statusColor[guardian.status] ||
                  "bg-white/10 text-white"
                }`}
              >
                {guardian.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}