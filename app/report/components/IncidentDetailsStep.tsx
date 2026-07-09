type Props = {
  title: string;
  description: string;
  isAnonymous: boolean;
  area: string;
  localGovernment: string;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setIsAnonymous: (value: boolean) => void;
  setArea: (value: string) => void;
  setLocalGovernment: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function IncidentDetailsStep({
  title,
  description,
  isAnonymous,
  area,
  localGovernment,
  setTitle,
  setDescription,
  setIsAnonymous,
  setArea,
  setLocalGovernment,
  onNext,
  onBack,
}: Props) {
  return (
    <section className="mt-8">
      <h1 className="text-4xl font-black">Describe it</h1>
      <p className="mt-3 text-white/60">
        Keep it simple. You can add more details later.
      </p>

      <div className="mt-6 space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short title e.g. Robbery near market"
          className="w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-4 text-white outline-none focus:border-emerald-500"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened?"
          rows={5}
          className="w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-4 text-white outline-none focus:border-emerald-500"
        />

        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Area e.g. Ilese, Abeokuta"
          className="w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-4 text-white outline-none focus:border-emerald-500"
        />

        <input
          value={localGovernment}
          onChange={(e) => setLocalGovernment(e.target.value)}
          placeholder="Local Government"
          className="w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-4 text-white outline-none focus:border-emerald-500"
        />

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111] p-4 text-white/70">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          Report anonymously
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 py-4 font-black text-white"
        >
          Back
        </button>

        <button
          disabled={!title}
          onClick={onNext}
          className="rounded-full bg-emerald-500 py-4 font-black text-black disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </section>
  );
}