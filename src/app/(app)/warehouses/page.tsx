import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canManageMaster, getAccessibleWarehouseIds } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { createWarehouse, updateWarehouseAccess, updateWarehouseInfo } from "./actions";

export default async function WarehousesPage() {
  const user = await requireUser();
  const warehouseIds = await getAccessibleWarehouseIds(user.role, user.departmentId);

  const [warehouses, departments] = await Promise.all([
    prisma.warehouse.findMany({
      where: { id: { in: warehouseIds }, isActive: true },
      include: {
        accesses: { include: { department: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const isAdmin = canManageMaster(user.role);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">창고 관리</h1>

      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">창고 신규 등록</h2>
          <form action={createWarehouse} className="mobile-stack">
            <input name="code" placeholder="창고 코드 (예: WH-NEW)" className="rounded-md border border-slate-300 px-3 py-2" required />
            <input name="name" placeholder="창고 이름" className="rounded-md border border-slate-300 px-3 py-2" required />
            <input name="description" placeholder="설명(선택)" className="rounded-md border border-slate-300 px-3 py-2" />
            <button className="rounded-md bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">등록</button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        {warehouses.map((wh) => (
          <article key={wh.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{wh.name}</h2>
                <p className="text-xs text-slate-500">{wh.code} | {wh.description || "설명 없음"}</p>
              </div>
              <Link href={`/warehouses/${wh.id}`} className="text-sm text-teal-700 hover:underline">
                상세 보기
              </Link>
            </div>

            <div className="mt-3 text-sm text-slate-700">
              사용 부서: {wh.accesses.length === 0 ? "없음" : wh.accesses.map((a) => a.department.name).join(", ")}
            </div>

            {isAdmin && (
              <form action={updateWarehouseInfo} className="mt-3 grid gap-2 md:grid-cols-4">
                <input type="hidden" name="warehouseId" value={wh.id} />
                <input name="code" defaultValue={wh.code} className="rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                <input name="name" defaultValue={wh.name} className="rounded-md border border-slate-300 px-3 py-2 text-sm" required />
                <input
                  name="description"
                  defaultValue={wh.description || ""}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="설명(선택)"
                />
                <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={wh.isActive} />
                  사용
                </label>
                <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">창고 정보 저장</button>
              </form>
            )}

            {isAdmin && (
              <form action={updateWarehouseAccess} className="mt-3 space-y-2">
                <input type="hidden" name="warehouseId" value={wh.id} />
                <div className="grid gap-2 md:grid-cols-4">
                  {departments.map((dept) => {
                    const checked = wh.accesses.some((a) => a.departmentId === dept.id);
                    return (
                      <label key={dept.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm">
                        <input type="checkbox" name="departmentIds" value={dept.id} defaultChecked={checked} />
                        {dept.name}
                      </label>
                    );
                  })}
                </div>
                <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">접근 부서 저장</button>
              </form>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}


