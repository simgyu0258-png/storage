"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageMaster } from "@/lib/permissions";
import { requireUser } from "@/lib/session";

export async function createDepartment(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) throw new Error("권한이 없습니다.");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("부서명을 입력해 주세요.");

  await prisma.department.create({ data: { name } });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateDepartment(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) throw new Error("권한이 없습니다.");

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name) throw new Error("부서명을 입력해 주세요.");

  await prisma.department.update({ where: { id }, data: { name, isActive } });
  revalidatePath("/admin/users");
}

export async function createUser(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) throw new Error("권한이 없습니다.");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "USER") as UserRole;
  const departmentId = String(formData.get("departmentId") || "").trim();

  if (!email || !name || !password || !departmentId) {
    throw new Error("필수 항목을 입력해 주세요.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      departmentId,
      isActive: true,
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function toggleUserActive(formData: FormData) {
  const user = await requireUser();
  if (!canManageMaster(user.role)) throw new Error("권한이 없습니다.");

  const id = String(formData.get("id") || "");
  const current = String(formData.get("current") || "false") === "true";

  await prisma.user.update({ where: { id }, data: { isActive: !current } });
  revalidatePath("/admin/users");
}


