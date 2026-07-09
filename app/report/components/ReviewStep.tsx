import type { ReportData } from "../types";

type Props = {
  data: ReportData;
  loading: boolean;
  onSubmit: () => void;
  onBack: () => void;
};

export default function ReviewStep({ data, loading, onSubmit, onBack }: Props) {
  return (
    <section className="mt-8">
      <h1 className="text-4xl font-black">Review Report</h1>
      <p className="mt-3 text-white/60">
        Check the details before submitting.
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-[2rem] border border-white/10 bg-[#111] p-5">
          <p className="text-sm text-white/50">Type</p>
          <p className="mt-1 font-black">{data.type}</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#111] p-5">
          <p className="text-sm text-white/50">Title</p>
          <p className="mt-1 font-black">{data.title}</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#111] p-5">
          <p className="text-sm text-white/50">Description</p>
          <p className="mt-1 text-white/80">
            {data.description || "No description added"}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#111] p-5">
          <p className="text-sm text-white/50">Location</p>
          <p className="mt-1 text-white/80">
            {data.latitude && data.longitude
              ? `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`
              : data.area || "No GPS location added"}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#111] p-5">
          <p className="text-sm text-white/50">Evidence</p>
          <p className="mt-1 text-white/80">
            {data.evidenceNote || "No evidence note added"}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#111] p-5">
          <p className="text-sm text-white/50">Anonymous</p>
          <p className="mt-1 font-black">{data.isAnonymous ? "YES" : "NO"}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 py-4 font-black text-white"
        >
          Back
        </button>

        <button
          disabled={loading}
          onClick={onSubmit}
          className="rounded-full bg-emerald-500 py-4 font-black text-black disabled:opacity-40"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </section>
  );
}