import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canManageMaster } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { itemTypeLabel } from "@/lib/format";
import { createItem } from "./actions";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams?: { q?: string; type?: "CONSUMABLE" | "EQUIPMENT" };
}) {
  const user = await requireUser();
  const isAdmin = canManageMaster(user.role);
  const q = searchParams?.q?.trim() || "";
  const type = searchParams?.type;

  const [items, categories, locations] = await Promise.all([
    prisma.item.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {}),
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
      include: { category: true, defaultLocation: true },
      orderBy: { name: "asc" },
    }),
    prisma.itemCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { isActive: true }, include: { warehouse: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">품목 관리</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <form className="mobile-stack" method="get">
          <input name="q" defaultValue={q} className="rounded-md border border-slate-300 px-3 py-2" placeholder="품목명/코드/키워드 검색" />
          <select name="type" defaultValue={type || ""} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">전체 유형</option>
            <option value="CONSUMABLE">소모품</option>
            <option value="EQUIPMENT">비품</option>
          </select>
          <button className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">검색</button>
        </form>
      </section>

      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">품목 등록</h2>
          <form action={createItem} className="grid gap-2 md:grid-cols-3">
            <input name="itemCode" placeholder="품목코드" className="rounded-md border border-slate-300 px-3 py-2" required />
            <input name="name" placeholder="품목명" className="rounded-md border border-slate-300 px-3 py-2" required />
            <select name="type" className="rounded-md border border-slate-300 px-3 py-2" defaultValue="CONSUMABLE">
              <option value="CONSUMABLE">소모품</option>
              <option value="EQUIPMENT">비품</option>
            </select>
            <select name="categoryId" className="rounded-md border border-slate-300 px-3 py-2" defaultValue="">
              <option value="">카테고리(선택)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input name="specification" placeholder="규격(선택)" className="rounded-md border border-slate-300 px-3 py-2" />
            <input name="unit" placeholder="단위(예: 개, 박스)" className="rounded-md border border-slate-300 px-3 py-2" required />
            <select name="defaultLocationId" className="rounded-md border border-slate-300 px-3 py-2" defaultValue="">
              <option value="">기본 보관 위치(선택)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.warehouse.name} / {loc.name}</option>
              ))}
            </select>
            <input name="searchKeywords" placeholder="검색 키워드(쉼표 구분)" className="rounded-md border border-slate-300 px-3 py-2" />
            <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked /> 사용
            </label>
            <button className="rounded-md bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-800">등록</button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>코드</th>
                <th>품목명</th>
                <th>유형</th>
                <th>카테고리</th>
                <th>단위</th>
                <th>기본 위치</th>
                {isAdmin && <th>수정</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.itemCode}</td>
                  <td>{item.name}</td>
                  <td>{itemTypeLabel(item.type)}</td>
                  <td>{item.category?.name || "-"}</td>
                  <td>{item.unit}</td>
                  <td>{item.defaultLocation?.name || "-"}</td>
                  {isAdmin && (
                    <td>
                      <Link href={`/items/${item.id}/edit`} className="text-sm text-teal-700 hover:underline">
                        편집
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


