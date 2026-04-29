import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function isSystemAdmin(role: UserRole) {
  return role === UserRole.SYSTEM_ADMIN;
}

export function canAdjustStock(role: UserRole) {
  return role === UserRole.SYSTEM_ADMIN || role === UserRole.DEPT_ADMIN;
}

export function canManageMaster(role: UserRole) {
  return role === UserRole.SYSTEM_ADMIN;
}

export async function getAccessibleWarehouseIds(role: UserRole, departmentId: string) {
  if (isSystemAdmin(role)) {
    const warehouses = await prisma.warehouse.findMany({ where: { isActive: true }, select: { id: true } });
    return warehouses.map((w) => w.id);
  }

  const accesses = await prisma.warehouseDepartmentAccess.findMany({
    where: { departmentId, warehouse: { isActive: true } },
    select: { warehouseId: true },
  });

  return accesses.map((a) => a.warehouseId);
}

export async function assertWarehouseAccess(params: {
  role: UserRole;
  departmentId: string;
  warehouseId: string;
}) {
  if (isSystemAdmin(params.role)) {
    return true;
  }

  const access = await prisma.warehouseDepartmentAccess.findFirst({
    where: {
      departmentId: params.departmentId,
      warehouseId: params.warehouseId,
      warehouse: { isActive: true },
    },
    select: { id: true },
  });

  return Boolean(access);
}


