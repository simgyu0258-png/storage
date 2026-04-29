import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canManageMaster } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { updateItem } from "../../actions";

export default async function EditItemPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) {
    notFound();
  }

  const [item, categories, locations] = await Promise.all([
    prisma.item.findUnique({ where: { id: params.id } }),
    prisma.itemCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { isActive: true }, include: { warehouse: true }, orderBy: { name: "asc" } }),
  ]);

  if (!item) {
    notFound();
  }

  const action = updateItem.bind(null, item.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">품목 수정</h1>
        <Link href="/items" className="text-sm text-teal-700 hover:underline">목록으로</Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <form action={action} className="grid gap-2 md:grid-cols-3">
          <input name="itemCode" defaultValue={item.itemCode} className="rounded-md border border-slate-300 px-3 py-2" required />
          <input name="name" defaultValue={item.name} className="rounded-md border border-slate-300 px-3 py-2" required />
          <select name="type" className="rounded-md border border-slate-300 px-3 py-2" defaultValue={item.type}>
            <option value="CONSUMABLE">소모품</option>
            <option value="EQUIPMENT">비품</option>
          </select>

          <select name="categoryId" className="rounded-md border border-slate-300 px-3 py-2" defaultValue={item.categoryId || ""}>
            <option value="">카테고리(선택)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="specification" defaultValue={item.specification || ""} placeholder="규격" className="rounded-md border border-slate-300 px-3 py-2" />
          <input name="unit" defaultValue={item.unit} className="rounded-md border border-slate-300 px-3 py-2" required />

          <input name="minStock" type="number" defaultValue={item.minStock} className="rounded-md border border-slate-300 px-3 py-2" />
          <select name="defaultLocationId" className="rounded-md border border-slate-300 px-3 py-2" defaultValue={item.defaultLocationId || ""}>
            <option value="">기본 보관 위치(선택)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.warehouse.name} / {loc.name}</option>
            ))}
          </select>
          <input name="searchKeywords" defaultValue={item.searchKeywords || ""} className="rounded-md border border-slate-300 px-3 py-2" />

          <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={item.isActive} /> 사용
          </label>
          <button className="rounded-md bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-800">저장</button>
        </form>
      </section>
    </div>
  );
}


