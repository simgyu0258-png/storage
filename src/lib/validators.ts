import { z } from "zod";

export const itemSchema = z.object({
  itemCode: z.string().min(2, "품목 코드를 입력해 주세요."),
  name: z.string().min(1, "품목명을 입력해 주세요."),
  type: z.enum(["CONSUMABLE", "EQUIPMENT"]),
  categoryId: z.string().optional(),
  specification: z.string().optional(),
  unit: z.string().min(1, "단위를 입력해 주세요."),
  minStock: z.coerce.number().int().min(0).default(0),
  defaultLocationId: z.string().optional(),
  searchKeywords: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
});

export const stockTransactionSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST"]),
  warehouseId: z.string().min(1, "창고를 선택해 주세요."),
  itemId: z.string().optional(),
  actorName: z.string().min(1, "작업자명을 입력해 주세요."),
  quantity: z.coerce.number().int().min(0, "수량은 0 이상이어야 합니다."),
  note: z.string().max(300, "비고는 300자 이내로 입력해 주세요.").optional(),
  reason: z.string().max(200, "조정 사유는 200자 이내로 입력해 주세요.").optional(),
  departmentId: z.string().optional(),
});

export const historyFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  warehouseId: z.string().optional(),
  itemId: z.string().optional(),
  departmentId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUST"]).optional(),
});


