import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canManageMaster } from "@/lib/permissions";
import { roleLabel } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { createDepartment, createUser, toggleUserActive, updateDepartment } from "./actions";

export default async function AdminUsersPage() {
  const user = await requireUser();
  if (!canManageMaster(user.role)) {
    notFound();
  }

  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ include: { department: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">사용자/부서 관리 (관리자)</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">부서 추가</h2>
        <form action={createDepartment} className="flex gap-2">
          <input name="name" placeholder="부서명" className="w-full rounded-md border border-slate-300 px-3 py-2" required />
          <button className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">추가</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">부서 목록</h2>
        <div className="space-y-2">
          {departments.map((dept) => (
            <form key={dept.id} action={updateDepartment} className="flex items-center gap-2">
              <input type="hidden" name="id" value={dept.id} />
              <input
                name="name"
                defaultValue={dept.name}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <label className="flex items-center gap-1 text-sm text-slate-600">
                <input type="checkbox" name="isActive" defaultChecked={dept.isActive} />
                사용
              </label>
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                저장
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">사용자 추가</h2>
        <form action={createUser} className="grid gap-2 md:grid-cols-5">
          <input name="email" type="email" placeholder="이메일" className="rounded-md border border-slate-300 px-3 py-2" required />
          <input name="name" placeholder="이름" className="rounded-md border border-slate-300 px-3 py-2" required />
          <input name="password" placeholder="초기 비밀번호" className="rounded-md border border-slate-300 px-3 py-2" required />
          <select name="role" className="rounded-md border border-slate-300 px-3 py-2" defaultValue={UserRole.USER}>
            <option value={UserRole.SYSTEM_ADMIN}>시스템 관리자</option>
            <option value={UserRole.DEPT_ADMIN}>부서 관리자</option>
            <option value={UserRole.USER}>일반 사용자</option>
          </select>
          <select name="departmentId" className="rounded-md border border-slate-300 px-3 py-2" required>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button className="rounded-md bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-800">생성</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">사용자 목록</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>권한</th>
                <th>부서</th>
                <th>상태</th>
                <th>조치</th>
              </tr>
            </thead>
            <tbody>
              {users.map((target) => (
                <tr key={target.id}>
                  <td>{target.name}</td>
                  <td>{target.email}</td>
                  <td>{roleLabel(target.role)}</td>
                  <td>{target.department.name}</td>
                  <td>{target.isActive ? "활성" : "비활성"}</td>
                  <td>
                    <form action={toggleUserActive}>
                      <input type="hidden" name="id" value={target.id} />
                      <input type="hidden" name="current" value={String(target.isActive)} />
                      <button className="text-sm text-teal-700 hover:underline">
                        {target.isActive ? "비활성화" : "활성화"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


