import Link from "next/link";

export function BackLink({ href = "/more" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-sm text-neutral-500">
      <span>‹</span> More
    </Link>
  );
}
