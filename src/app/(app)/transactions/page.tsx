import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAccessibleWarehouseIds, isSystemAdmin } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { formatDateTime, txTypeLabel } from "@/lib/format";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: {
    from?: string;
    to?: string;
    warehouseId?: string;
    itemId?: string;
    departmentId?: string;
    type?: TransactionType;
  };
}) {
  const user = await requireUser();
  const accessibleWarehouseIds = await getAccessibleWarehouseIds(user.role, user.departmentId);

  const from = searchParams?.from ? new Date(searchParams.from) : undefined;
  const to = searchParams?.to ? new Date(searchParams.to) : undefined;

  if (to) {
    to.setHours(23, 59, 59, 999);
  }

  const warehouseFilter =
    searchParams?.warehouseId && accessibleWarehouseIds.includes(searchParams.warehouseId)
      ? [searchParams.warehouseId]
      : accessibleWarehouseIds;

  const txs = await prisma.stockTransaction.findMany({
    where: {
      warehouseId: { in: warehouseFilter },
      ...(searchParams?.itemId ? { itemId: searchParams.itemId } : {}),
      ...(searchParams?.type ? { type: searchParams.type } : {}),
      ...(isSystemAdmin(user.role)
        ? searchParams?.departmentId
          ? { departmentId: searchParams.departmentId }
          : {}
        : { departmentId: user.departmentId }),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    include: {
      warehouse: true,
      item: true,
      department: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const [warehouses, items, departments] = await Promise.all([
    prisma.warehouse.findMany({ where: { id: { in: accessibleWarehouseIds } }, select: { id: true, name: true } }),
    prisma.item.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">입출고 이력</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <form method="get" className="grid gap-2 md:grid-cols-3">
          <input type="date" name="from" defaultValue={searchParams?.from} className="rounded-md border border-slate-300 px-3 py-2" />
          <input type="date" name="to" defaultValue={searchParams?.to} className="rounded-md border border-slate-300 px-3 py-2" />
          <select name="warehouseId" defaultValue={searchParams?.warehouseId || ""} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">전체 창고</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select name="itemId" defaultValue={searchParams?.itemId || ""} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">전체 품목</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>

          <select name="type" defaultValue={searchParams?.type || ""} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">전체 유형</option>
            <option value="IN">입고</option>
            <option value="OUT">출고</option>
            <option value="ADJUST">조정</option>
          </select>

          <select
            name="departmentId"
            defaultValue={searchParams?.departmentId || ""}
            className="rounded-md border border-slate-300 px-3 py-2"
            disabled={!isSystemAdmin(user.role)}
          >
            <option value="">전체 부서</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <button className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">조회</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>일시</th>
                <th>유형</th>
                <th>창고</th>
                <th>품목</th>
                <th>수량</th>
                <th>이전</th>
                <th>이후</th>
                <th>부서</th>
                <th>작업자명</th>
                <th>사유/비고</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDateTime(tx.createdAt)}</td>
                  <td>{txTypeLabel(tx.type)}</td>
                  <td>{tx.warehouse.name}</td>
                  <td>{tx.item.name}</td>
                  <td>{tx.quantity}</td>
                  <td>{tx.beforeQty}</td>
                  <td>{tx.afterQty}</td>
                  <td>{tx.department.name}</td>
                  <td>{tx.actorName}</td>
                  <td>{tx.reason || tx.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


