import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { NavLink } from "@/components/NavLink";
import { roleLabel } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="text-lg font-bold text-slate-900">
              창고 관리 시스템
            </Link>
            <p className="text-xs text-slate-500">
              {session.user.name} ({roleLabel(session.user.role)}) | {session.user.departmentName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <NavLink href="/dashboard" label="대시보드" />
            <NavLink href="/inventory" label="재고 조회" />
            <NavLink href="/transactions/new" label="입출고 등록" />
            <NavLink href="/transactions" label="이력 조회" />
            <NavLink href="/items" label="품목 관리" />
            <NavLink href="/warehouses" label="창고 관리" />
            {session.user.role === "SYSTEM_ADMIN" && <NavLink href="/admin/users" label="사용자관리" />}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}


