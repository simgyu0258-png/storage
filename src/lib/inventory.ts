import { TransactionType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertWarehouseAccess, canAdjustStock, isSystemAdmin } from "@/lib/permissions";

type ExecuteTxInput = {
  type: TransactionType;
  warehouseId: string;
  itemId: string;
  actorName: string;
  quantity: number;
  note?: string;
  reason?: string;
  selectedDepartmentId?: string;
  sessionUser: {
    id: string;
    role: UserRole;
    departmentId: string;
  };
};

export async function executeStockTransaction(input: ExecuteTxInput) {
  if (!input.actorName.trim()) {
    throw new Error("작업자명을 입력해 주세요.");
  }

  if ((input.type === TransactionType.IN || input.type === TransactionType.OUT) && input.quantity <= 0) {
    throw new Error("입고/출고 수량은 1 이상이어야 합니다.");
  }
  if (input.type === TransactionType.ADJUST && input.quantity < 0) {
    throw new Error("조정 재고는 0 이상이어야 합니다.");
  }

  if (input.type === TransactionType.ADJUST && !canAdjustStock(input.sessionUser.role)) {
    throw new Error("재고 조정 권한이 없습니다.");
  }

  const hasAccess = await assertWarehouseAccess({
    role: input.sessionUser.role,
    departmentId: input.sessionUser.departmentId,
    warehouseId: input.warehouseId,
  });

  if (!hasAccess) {
    throw new Error("해당 창고에 접근 권한이 없습니다.");
  }

  const departmentId = isSystemAdmin(input.sessionUser.role)
    ? input.selectedDepartmentId ?? input.sessionUser.departmentId
    : input.sessionUser.departmentId;

  if (!departmentId) {
    throw new Error("부서 정보가 없습니다.");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventory.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: input.warehouseId,
          itemId: input.itemId,
        },
      },
    });

    const beforeQty = existing?.quantity ?? 0;
    let afterQty = beforeQty;

    if (input.type === TransactionType.IN) {
      afterQty = beforeQty + input.quantity;
    }

    if (input.type === TransactionType.OUT) {
      if (beforeQty < input.quantity) {
        throw new Error(`출고 수량이 현재 재고(${beforeQty})보다 많습니다.`);
      }
      afterQty = beforeQty - input.quantity;
    }

    if (input.type === TransactionType.ADJUST) {
      if (!input.reason?.trim()) {
        throw new Error("재고 조정 시 사유를 입력해 주세요.");
      }
      afterQty = input.quantity;
    }

    await tx.inventory.upsert({
      where: {
        warehouseId_itemId: {
          warehouseId: input.warehouseId,
          itemId: input.itemId,
        },
      },
      create: {
        warehouseId: input.warehouseId,
        itemId: input.itemId,
        quantity: afterQty,
      },
      update: {
        quantity: afterQty,
      },
    });

    const txQty = input.type === TransactionType.ADJUST ? Math.abs(afterQty - beforeQty) : input.quantity;

    return tx.stockTransaction.create({
      data: {
        type: input.type,
        warehouseId: input.warehouseId,
        itemId: input.itemId,
        actorName: input.actorName.trim(),
        quantity: txQty,
        beforeQty,
        afterQty,
        note: input.note,
        reason: input.reason,
        departmentId,
        userId: input.sessionUser.id,
      },
    });
  });
}

