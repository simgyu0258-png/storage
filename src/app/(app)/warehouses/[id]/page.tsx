import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertWarehouseAccess } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export default async function WarehouseDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const hasAccess = await assertWarehouseAccess({
    role: user.role,
    departmentId: user.departmentId,
    warehouseId: params.id,
  });

  if (!hasAccess) {
    notFound();
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: params.id },
    include: {
      accesses: { include: { department: true } },
      inventories: {
        include: { item: true },
        orderBy: { updatedAt: "desc" },
      },
      locations: true,
    },
  });

  if (!warehouse) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{warehouse.name}</h1>
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p>창고 코드: {warehouse.code}</p>
        <p>설명: {warehouse.description || "-"}</p>
        <p>사용 부서: {warehouse.accesses.map((a) => a.department.name).join(", ") || "없음"}</p>
        <p>보관 위치: {warehouse.locations.map((l) => l.name).join(", ") || "없음"}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">현재 재고</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>품목 코드</th>
                <th>품목명</th>
                <th>현재 수량</th>
                <th>단위</th>
              </tr>
            </thead>
            <tbody>
              {warehouse.inventories.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.item.itemCode}</td>
                  <td>{inv.item.name}</td>
                  <td>{inv.quantity}</td>
                  <td>{inv.item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


