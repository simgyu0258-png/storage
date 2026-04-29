import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">창고 물품 관리</h1>
        <p className="mt-2 text-sm text-slate-600">부서별 자율 입출고 기록 MVP</p>
        <div className="mt-6">
          <Suspense fallback={<div>로딩 중...</div>}>
            <LoginForm />
          </Suspense>
        </div>
        <div className="mt-5 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <p>테스트 계정: admin@company.com / Admin123!</p>
        </div>
      </section>
    </main>
  );
}


