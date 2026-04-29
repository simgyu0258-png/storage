import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAccessibleWarehouseIds } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { formatDateTime, itemTypeLabel, txTypeLabel } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const warehouseIds = await getAccessibleWarehouseIds(user.role, user.departmentId);

  const [warehouseCount, itemCount, lowStockRows, recentTransactions] = await Promise.all([
    prisma.warehouse.count({ where: { id: { in: warehouseIds }, isActive: true } }),
    prisma.item.count({ where: { isActive: true } }),
    prisma.inventory.findMany({
      where: {
        warehouseId: { in: warehouseIds },
        item: { isActive: true },
      },
      include: { item: true, warehouse: true },
    }),
    prisma.stockTransaction.findMany({
      where: { warehouseId: { in: warehouseIds } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { warehouse: true, item: true, department: true },
    }),
  ]);

  const lowStock = lowStockRows.filter((row) => row.quantity <= row.item.minStock);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard title="접근 가능 창고" value={`${warehouseCount}개`} />
        <StatCard title="전체 품목" value={`${itemCount}개`} />
        <StatCard title="재고 부족" value={`${lowStock.length}개`} danger />
        <StatCard title="빠른 등록" value="입고/출고" href="/transactions/new" />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">재고 부족 품목</h2>
          <Link href="/inventory" className="text-sm text-teal-700 hover:underline">
            재고 화면으로 이동
          </Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-slate-500">현재 재고 부족 품목이 없습니다.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>창고</th>
                  <th>품목</th>
                  <th>유형</th>
                  <th>현재</th>
                  <th>최소 재고</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 10).map((row) => (
                  <tr key={row.id}>
                    <td>{row.warehouse.name}</td>
                    <td>{row.item.name}</td>
                    <td>{itemTypeLabel(row.item.type)}</td>
                    <td className="font-semibold text-amber-700">{row.quantity}</td>
                    <td>{row.item.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">최근 입출고 내역</h2>
          <Link href="/transactions" className="text-sm text-teal-700 hover:underline">
            전체 이력 보기
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>일시</th>
                <th>유형</th>
                <th>창고</th>
                <th>품목</th>
                <th>수량</th>
                <th>부서</th>
                <th>작업자명</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDateTime(tx.createdAt)}</td>
                  <td>{txTypeLabel(tx.type)}</td>
                  <td>{tx.warehouse.name}</td>
                  <td>{tx.item.name}</td>
                  <td>{tx.quantity}</td>
                  <td>{tx.department.name}</td>
                  <td>{tx.actorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  danger,
}: {
  title: string;
  value: string;
  href?: string;
  danger?: boolean;
}) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${danger ? "text-rose-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}


