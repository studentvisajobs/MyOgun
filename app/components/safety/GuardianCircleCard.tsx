import Link from "next/link";

export default function GuardianCircleCard({ count }: { count: number }) {
  return (
    <Link
      href="/guardian-circle"
      className="rounded-[1.7rem] border border-white/10 bg-[#121212] p-5"
    >
      <div className="text-3xl">👥</div>
      <h3 className="mt-4 text-lg font-black">Guardians</h3>
      <p className="mt-2 text-sm text-white/60">
        {count} trusted contacts
      </p>
    </Link>
  );
}