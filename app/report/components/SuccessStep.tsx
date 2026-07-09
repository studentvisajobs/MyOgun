import Link from "next/link";

export default function SuccessStep({
  incidentId,
}: {
  incidentId: string | null;
}) {
  return (
    <section className="mt-8 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
      <p className="text-6xl">✅</p>

      <h1 className="mt-5 text-4xl font-black">Report Submitted</h1>

      <p className="mt-3 text-white/70">
        Thank you. Your report has been added to MyOgun Community Intelligence.
      </p>

      {incidentId && (
        <p className="mt-4 rounded-full bg-black/40 px-4 py-3 text-sm text-white/60">
          Reference: {incidentId}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {incidentId && (
          <Link
            href={`/incidents/${incidentId}`}
            className="block rounded-full bg-emerald-500 py-4 font-black text-black"
          >
            View Report
          </Link>
        )}

        <Link
          href="/"
          className="block rounded-full border border-white/10 bg-white/5 py-4 font-black text-white"
        >
         Home
        </Link>
      </div>
    </section>
  );
}