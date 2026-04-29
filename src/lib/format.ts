import { UserRole } from "@prisma/client";

export function roleLabel(role: UserRole) {
  if (role === "SYSTEM_ADMIN") return "시스템 관리자";
  if (role === "DEPT_ADMIN") return "부서 관리자";
  return "일반 사용자";
}

export function txTypeLabel(type: "IN" | "OUT" | "ADJUST") {
  if (type === "IN") return "입고";
  if (type === "OUT") return "출고";
  return "조정";
}

export function itemTypeLabel(type: "CONSUMABLE" | "EQUIPMENT") {
  return type === "CONSUMABLE" ? "소모품" : "비품";
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}


