import Link from "next/link";

export function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
    >
      {label}
    </Link>
  );
}


