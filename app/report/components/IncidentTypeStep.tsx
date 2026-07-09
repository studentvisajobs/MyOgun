const incidentTypes = [
  { label: "Robbery", value: "ROBBERY", icon: "🚔" },
  { label: "Kidnapping", value: "KIDNAPPING", icon: "🚨" },
  { label: "Accident", value: "ACCIDENT", icon: "🚗" },
  { label: "Fire", value: "FIRE", icon: "🔥" },
  { label: "Flood", value: "FLOOD", icon: "🌊" },
  { label: "Missing Person", value: "MISSING_PERSON", icon: "👤" },
  { label: "Suspicious Activity", value: "SUSPICIOUS_ACTIVITY", icon: "⚠️" },
  { label: "Other", value: "OTHER", icon: "📝" },
];

type Props = {
  selected: string;
  onSelect: (type: string) => void;
  onNext: () => void;
};

export default function IncidentTypeStep({ selected, onSelect, onNext }: Props) {
  return (
    <section className="mt-8">
      <h1 className="text-4xl font-black">What happened?</h1>
      <p className="mt-3 text-white/60">
        Choose the type of incident you want to report.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {incidentTypes.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            className={`rounded-[1.7rem] border p-5 text-left transition ${
              selected === item.value
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-white/10 bg-[#111]"
            }`}
          >
            <p className="text-3xl">{item.icon}</p>
            <h2 className="mt-4 font-black">{item.label}</h2>
          </button>
        ))}
      </div>

      <button
        disabled={!selected}
        onClick={onNext}
        className="mt-6 w-full rounded-full bg-emerald-500 py-4 font-black text-black disabled:opacity-40"
      >
        Continue
      </button>
    </section>
  );
}