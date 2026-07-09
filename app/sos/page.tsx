import Link from "next/link";

export default function SOSPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold text-emerald-400">
          ← Home
        </Link>

        <section className="mt-10 rounded-[2rem] border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-6xl">🚨</p>
          <h1 className="mt-6 text-4xl font-black">Silent SOS</h1>
          <p className="mt-4 text-white/70">
            Emergency silent alert system. This will connect to Guardian Circle,
            Twilio, location tracking, and emergency evidence capture.
          </p>

          <button className="mt-8 w-full rounded-full bg-red-600 px-6 py-4 font-black text-white">
            Hold to Activate SOS
          </button>
        </section>
      </div>
    </main>
  );
}