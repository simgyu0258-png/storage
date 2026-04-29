"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageMaster } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export async function createWarehouse(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) {
    throw new Error("권한이 없습니다.");
  }

  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!code || !name) {
    throw new Error("창고 코드와 이름은 필수입니다.");
  }

  await prisma.warehouse.create({
    data: { code, name, description: description || null },
  });

  revalidatePath("/warehouses");
  redirect("/warehouses");
}

export async function updateWarehouseAccess(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) {
    throw new Error("권한이 없습니다.");
  }

  const warehouseId = String(formData.get("warehouseId") || "");
  const selectedDepartmentIds = formData.getAll("departmentIds").map(String);

  if (!warehouseId) {
    throw new Error("창고 정보가 올바르지 않습니다.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.warehouseDepartmentAccess.deleteMany({ where: { warehouseId } });

    if (selectedDepartmentIds.length > 0) {
      await tx.warehouseDepartmentAccess.createMany({
        data: selectedDepartmentIds.map((departmentId) => ({ warehouseId, departmentId })),
      });
    }
  });

  revalidatePath("/warehouses");
  revalidatePath(`/warehouses/${warehouseId}`);
}

export async function updateWarehouseInfo(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) {
    throw new Error("권한이 없습니다.");
  }

  const warehouseId = String(formData.get("warehouseId") || "");
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!warehouseId || !code || !name) {
    throw new Error("창고 코드와 이름은 필수입니다.");
  }

  await prisma.warehouse.update({
    where: { id: warehouseId },
    data: {
      code,
      name,
      description: description || null,
      isActive,
    },
  });

  revalidatePath("/warehouses");
  revalidatePath(`/warehouses/${warehouseId}`);
}


