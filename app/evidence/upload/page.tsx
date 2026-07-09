import Link from "next/link";

export default function UploadEvidencePage() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-bold text-emerald-400">
          ← Home
        </Link>

        <section className="mt-8 rounded-[2rem] border border-emerald-500/20 bg-[#111] p-6">
          <p className="text-sm font-black tracking-[0.35em] text-emerald-400">
            MYOGUN
          </p>

          <h1 className="mt-4 text-4xl font-black">Upload Evidence</h1>

          <p className="mt-3 text-white/60">
            Add photos, videos, audio, or files linked to an incident or emergency.
          </p>

          <div className="mt-6 space-y-4">
            <button className="w-full rounded-3xl border border-white/10 bg-black/30 p-5 text-left">
              <p className="text-3xl">📷</p>
              <h2 className="mt-3 text-xl font-black">Upload Photo</h2>
              <p className="mt-1 text-sm text-white/50">Coming next</p>
            </button>

            <button className="w-full rounded-3xl border border-white/10 bg-black/30 p-5 text-left">
              <p className="text-3xl">🎥</p>
              <h2 className="mt-3 text-xl font-black">Upload Video</h2>
              <p className="mt-1 text-sm text-white/50">Coming next</p>
            </button>

            <button className="w-full rounded-3xl border border-white/10 bg-black/30 p-5 text-left">
              <p className="text-3xl">🎤</p>
              <h2 className="mt-3 text-xl font-black">Upload Audio</h2>
              <p className="mt-1 text-sm text-white/50">Coming next</p>
            </button>
          </div>

          <Link
            href="/evidence"
            className="mt-6 block rounded-full bg-emerald-500 py-4 text-center font-black text-black"
          >
            Open Evidence Vault
          </Link>
        </section>
      </div>
    </main>
  );
}