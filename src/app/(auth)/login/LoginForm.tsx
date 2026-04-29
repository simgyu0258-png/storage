"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("admin@company.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
      setLoading(false);
      return;
    }

    window.location.href = result?.url || callbackUrl;
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">이메일</label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">비밀번호</label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
      <button
        disabled={loading}
        className="w-full rounded-md bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        type="submit"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}


