"use client";

import { useEffect, useMemo, useState } from "react";

type ItemOption = {
  id: string;
  label: string;
};

type WarehouseOption = {
  id: string;
  name: string;
};

type DepartmentOption = {
  id: string;
  name: string;
};

export default function QuickTransactionForm({
  warehouses,
  items,
  recentItems,
  departments,
  canAdjust,
  isSystemAdmin,
}: {
  warehouses: WarehouseOption[];
  items: ItemOption[];
  recentItems: ItemOption[];
  departments: DepartmentOption[];
  canAdjust: boolean;
  isSystemAdmin: boolean;
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedType, setSelectedType] = useState<"IN" | "OUT" | "ADJUST">("OUT");
  const [createNewItem, setCreateNewItem] = useState(false);

  const filteredItems = useMemo(() => {
    if (!keyword.trim()) return items;
    const q = keyword.trim().toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 120);
  }, [items, keyword]);

  useEffect(() => {
    if (selectedType !== "IN" && createNewItem) {
      setCreateNewItem(false);
    }
  }, [selectedType, createNewItem]);

  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${canAdjust ? "grid-cols-3" : "grid-cols-2"}`}>
        <label
          className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium ${
            selectedType === "IN"
              ? "border-teal-700 bg-teal-700 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <input
            type="radio"
            name="typeOption"
            value="IN"
            className="sr-only"
            checked={selectedType === "IN"}
            onChange={() => setSelectedType("IN")}
          />
          입고
        </label>
        <label
          className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium ${
            selectedType === "OUT"
              ? "border-teal-700 bg-teal-700 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <input
            type="radio"
            name="typeOption"
            value="OUT"
            className="sr-only"
            checked={selectedType === "OUT"}
            onChange={() => setSelectedType("OUT")}
          />
          출고
        </label>
        {canAdjust && (
          <label
            className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium ${
              selectedType === "ADJUST"
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="typeOption"
              value="ADJUST"
              className="sr-only"
              checked={selectedType === "ADJUST"}
              onChange={() => setSelectedType("ADJUST")}
            />
            조정
          </label>
        )}
      </div>

      <input type="hidden" name="type" value={selectedType} />
      <input type="hidden" name="createNewItem" value={createNewItem ? "1" : "0"} />

      <div className="grid gap-2 md:grid-cols-2">
        <select name="warehouseId" required className="rounded-md border border-slate-300 px-3 py-2">
          <option value="">창고 선택</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="품목 검색어 입력"
        />
      </div>

      <select
        name="itemId"
        required={!createNewItem}
        disabled={createNewItem}
        className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
      >
        <option value="">품목 선택</option>
        {filteredItems.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>

      {selectedType === "IN" && (
        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={createNewItem}
            onChange={(e) => setCreateNewItem(e.target.checked)}
          />
          신규 품목 등록 후 입고
        </label>
      )}

      {selectedType === "IN" && createNewItem && (
        <div className="grid gap-2 md:grid-cols-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <input
            name="newItemName"
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="신규 품목명"
            required
          />
          <input
            name="newItemCode"
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="품목코드(선택, 비우면 자동 생성)"
          />
          <select name="newItemType" defaultValue="CONSUMABLE" className="rounded-md border border-slate-300 px-3 py-2">
            <option value="CONSUMABLE">소모품</option>
            <option value="EQUIPMENT">비품</option>
          </select>
          <input
            name="newItemUnit"
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="단위 (예: 개, 박스)"
            required
          />
          <input
            name="newItemMinStock"
            type="number"
            min={0}
            defaultValue={0}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="최소 재고"
          />
          <input
            name="newItemSpecification"
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="규격(선택)"
          />
        </div>
      )}

      {recentItems.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-slate-500">최근 사용 품목</p>
          <div className="flex flex-wrap gap-2">
            {recentItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setKeyword(item.label)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        <input
          name="actorName"
          required
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="작업자명 (필수)"
        />
        <input
          type="number"
          name="quantity"
          min={0}
          required
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder={selectedType === "ADJUST" ? "조정 후 최종 재고 수량" : "수량"}
        />
        {isSystemAdmin ? (
          <select name="departmentId" className="rounded-md border border-slate-300 px-3 py-2">
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <input disabled value="내 부서 자동 기록" className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500" />
        )}
      </div>

      {selectedType === "ADJUST" && (
        <input
          name="reason"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="조정 사유 (필수)"
          required
        />
      )}

      <textarea
        name="note"
        rows={3}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
        placeholder="비고(선택)"
      />

      <button className="w-full rounded-md bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800">
        저장
      </button>
    </div>
  );
}


