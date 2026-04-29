"use server";

import { ItemType, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { executeStockTransaction } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stockTransactionSchema } from "@/lib/validators";

async function createUniqueItemCode() {
  while (true) {
    const code = `ITM-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")}`;
    const exists = await prisma.item.findUnique({ where: { itemCode: code }, select: { id: true } });
    if (!exists) return code;
  }
}

export async function createTransaction(formData: FormData) {
  const user = await requireUser();

  const parsed = stockTransactionSchema.parse({
    type: formData.get("type"),
    warehouseId: formData.get("warehouseId"),
    itemId: formData.get("itemId") || undefined,
    actorName: formData.get("actorName"),
    quantity: formData.get("quantity"),
    note: formData.get("note") || undefined,
    reason: formData.get("reason") || undefined,
    departmentId: formData.get("departmentId") || undefined,
  });

  try {
    const createNewItem = String(formData.get("createNewItem") || "0") === "1";
    let targetItemId = parsed.itemId;

    if (parsed.type === "IN" && createNewItem) {
      const newItemName = String(formData.get("newItemName") || "").trim();
      const newItemUnit = String(formData.get("newItemUnit") || "").trim();
      const newItemCodeInput = String(formData.get("newItemCode") || "").trim();
      const newItemTypeRaw = String(formData.get("newItemType") || "CONSUMABLE");
      const newItemMinStock = Number(formData.get("newItemMinStock") || 0);
      const newItemSpecification = String(formData.get("newItemSpecification") || "").trim();

      if (!newItemName) {
        throw new Error("신규 품목명을 입력해 주세요.");
      }
      if (!newItemUnit) {
        throw new Error("신규 품목 단위를 입력해 주세요.");
      }
      if (Number.isNaN(newItemMinStock) || newItemMinStock < 0) {
        throw new Error("신규 품목 최소 재고는 0 이상이어야 합니다.");
      }

      const itemCode = newItemCodeInput || (await createUniqueItemCode());
      const newItemType = newItemTypeRaw === "EQUIPMENT" ? ItemType.EQUIPMENT : ItemType.CONSUMABLE;

      const createdItem = await prisma.item.create({
        data: {
          itemCode,
          name: newItemName,
          type: newItemType,
          unit: newItemUnit,
          minStock: Math.floor(newItemMinStock),
          specification: newItemSpecification || null,
          isActive: true,
        },
      });

      targetItemId = createdItem.id;
    }

    if (!targetItemId) {
      throw new Error("품목을 선택해 주세요.");
    }

    await executeStockTransaction({
      type: parsed.type as TransactionType,
      warehouseId: parsed.warehouseId,
      itemId: targetItemId,
      actorName: parsed.actorName,
      quantity: parsed.quantity,
      note: parsed.note,
      reason: parsed.reason,
      selectedDepartmentId: parsed.departmentId,
      sessionUser: {
        id: user.id,
        role: user.role,
        departmentId: user.departmentId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");
    revalidatePath("/items");
    redirect("/transactions/new?ok=1");
  } catch (error) {
    const message = error instanceof Error ? error.message : "등록 중 오류가 발생했습니다.";
    redirect(`/transactions/new?error=${encodeURIComponent(message)}`);
  }
}
