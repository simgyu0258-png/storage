"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageMaster } from "@/lib/permissions";
import { requireUser } from "@/lib/session";
import { itemSchema } from "@/lib/validators";

export async function createItem(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) {
    throw new Error("권한이 없습니다.");
  }

  const parsed = itemSchema.parse({
    itemCode: formData.get("itemCode"),
    name: formData.get("name"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId") || undefined,
    specification: formData.get("specification") || undefined,
    unit: formData.get("unit"),
    minStock: formData.get("minStock"),
    defaultLocationId: formData.get("defaultLocationId") || undefined,
    searchKeywords: formData.get("searchKeywords") || undefined,
    isActive: formData.get("isActive") === "on",
  });

  await prisma.item.create({
    data: {
      ...parsed,
      categoryId: parsed.categoryId || null,
      specification: parsed.specification || null,
      defaultLocationId: parsed.defaultLocationId || null,
      searchKeywords: parsed.searchKeywords || null,
    },
  });

  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(itemId: string, formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) {
    throw new Error("권한이 없습니다.");
  }

  const parsed = itemSchema.parse({
    itemCode: formData.get("itemCode"),
    name: formData.get("name"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId") || undefined,
    specification: formData.get("specification") || undefined,
    unit: formData.get("unit"),
    minStock: formData.get("minStock"),
    defaultLocationId: formData.get("defaultLocationId") || undefined,
    searchKeywords: formData.get("searchKeywords") || undefined,
    isActive: formData.get("isActive") === "on",
  });

  await prisma.item.update({
    where: { id: itemId },
    data: {
      ...parsed,
      categoryId: parsed.categoryId || null,
      specification: parsed.specification || null,
      defaultLocationId: parsed.defaultLocationId || null,
      searchKeywords: parsed.searchKeywords || null,
    },
  });

  revalidatePath("/items");
  revalidatePath(`/items/${itemId}/edit`);
  redirect("/items");
}


