type TimelineItem = {
  time: string;
  message: string;
};

export default function GuardianTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#121212] p-5">
      <h2 className="text-xl font-black">Guardian Timeline</h2>

      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border-l border-emerald-500/40 pl-4">
            <p className="text-xs font-bold text-emerald-400">{item.time}</p>
            <p className="mt-1 text-sm text-white/70">{item.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}