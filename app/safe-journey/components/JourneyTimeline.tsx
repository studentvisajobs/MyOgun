type Item = {
  message: string;
  createdAt: string;
};

export default function JourneyTimeline({
  items,
}: {
  items: Item[];
}) {
  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111] p-5">
      <h2 className="text-xl font-black">
        Journey Timeline
      </h2>

      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <p className="text-white/50">
            Journey not started.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="border-l border-emerald-500/40 pl-4"
            >
              <p className="text-xs text-emerald-400">
                {new Date(item.createdAt).toLocaleTimeString()}
              </p>

              <p className="mt-1 text-white/70">
                {item.message}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}