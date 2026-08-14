import Link from "next/link";

export function MoreMenuButton() {
  return (
    <Link
      href="/more"
      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-500"
    >
      More
    </Link>
  );
}
