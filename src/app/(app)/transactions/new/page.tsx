import { canAdjustStock, getAccessibleWarehouseIds, isSystemAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import QuickTransactionForm from "@/components/QuickTransactionForm";
import { createTransaction } from "../actions";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams?: { ok?: string; error?: string };
}) {
  const user = await requireUser();
  const warehouseIds = await getAccessibleWarehouseIds(user.role, user.departmentId);

  const [warehouses, items, recentTx, departments] = await Promise.all([
    prisma.warehouse.findMany({
      where: { id: { in: warehouseIds }, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.item.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, itemCode: true, name: true, unit: true },
    }),
    prisma.stockTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { item: true },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const recentItems = Array.from(new Map(recentTx.map((tx) => [tx.itemId, tx.item])).values())
    .slice(0, 5)
    .map((item) => ({ id: item.id, label: `${item.itemCode} | ${item.name}` }));

  const enhancedItems = items.map((item) => ({
    id: item.id,
    label: `${item.itemCode} | ${item.name} (${item.unit})`,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">빠른 입출고 등록</h1>
      <p className="text-sm text-slate-600">현장에서 빠르게 기록할 수 있도록 최소 입력만 받습니다.</p>

      {searchParams?.ok === "1" && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          저장되었습니다.
        </div>
      )}

      {searchParams?.error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          {searchParams.error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <form action={createTransaction}>
          <QuickTransactionForm
            warehouses={warehouses}
            items={enhancedItems}
            recentItems={recentItems}
            departments={departments}
            canAdjust={canAdjustStock(user.role)}
            isSystemAdmin={isSystemAdmin(user.role)}
          />
        </form>
      </section>
    </div>
  );
}


