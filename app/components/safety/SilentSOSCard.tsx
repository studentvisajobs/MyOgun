import Link from "next/link";

export default function SilentSOSCard() {
  return (
    <Link
      href="/silent-sos"
      className="rounded-[1.7rem] border border-red-500/30 bg-red-500/10 p-5"
    >
      <div className="text-3xl">🚨</div>
      <h3 className="mt-4 text-lg font-black">Silent SOS</h3>
      <p className="mt-2 text-sm text-white/60">
        Hold for emergency alert.
      </p>
    </Link>
  );
}