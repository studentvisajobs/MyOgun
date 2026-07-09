import Link from "next/link";

type SectionTitleProps = {
  title: string;
  href?: string;
  actionLabel?: string;
};

export default function SectionTitle({
  title,
  href,
  actionLabel = "View all",
}: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-black">{title}</h2>

      {href && (
        <Link href={href} className="text-sm font-bold text-emerald-400">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}