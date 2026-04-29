import { prisma } from "@/lib/prisma";
import { getAccessibleWarehouseIds } from "@/lib/permissions";
import { requireUser } from "@/lib/session";


export default async function InventoryPage({
  searchParams,
}: {
  searchParams?: { warehouseId?: string; q?: string };
}) {
  const user = await requireUser();
  const accessibleWarehouseIds = await getAccessibleWarehouseIds(user.role, user.departmentId);
  const q = searchParams?.q?.trim() || "";
  const selectedWarehouseId = searchParams?.warehouseId && accessibleWarehouseIds.includes(searchParams.warehouseId)
    ? searchParams.warehouseId
    : undefined;

  const [warehouses, rows] = await Promise.all([
    prisma.warehouse.findMany({
      where: { id: { in: accessibleWarehouseIds }, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.inventory.findMany({
      where: {
        warehouseId: { in: selectedWarehouseId ? [selectedWarehouseId] : accessibleWarehouseIds },
        item: {
          isActive: true,
          ...(q
            ? {
                OR: [
                  { name: { contains: q } },
                  { itemCode: { contains: q } },
                  { searchKeywords: { contains: q } },
                ],
              }
            : {}),
        },
      },
      include: {
        warehouse: true,
        item: true,
      },
      orderBy: [{ warehouse: { name: "asc" } }, { item: { name: "asc" } }],
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">재고 조회</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <form method="get" className="grid gap-2 md:grid-cols-3">
          <select name="warehouseId" defaultValue={selectedWarehouseId || ""} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">모든 창고</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <input name="q" defaultValue={q} placeholder="품목명/코드/키워드" className="rounded-md border border-slate-300 px-3 py-2" />
          <button className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">검색</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm text-slate-500">총 {rows.length}건</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>창고</th>
                <th>품목 코드</th>
                <th>품목명</th>
                <th>현재 수량</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.warehouse.name}</td>
                  <td>{row.item.itemCode}</td>
                  <td>{row.item.name}</td>
                  <td>{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


