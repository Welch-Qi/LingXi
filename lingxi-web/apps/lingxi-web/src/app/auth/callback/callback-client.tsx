"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCode, peekOAuthState } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const err = params.get("error");
    if (err) {
      setError(err);
      return;
    }
    if (!code) {
      setError("缺少授权码 code");
      return;
    }
    const expected = peekOAuthState();
    if (expected && state && expected !== state) {
      setError("OAuth state 不匹配，请重新登录");
      return;
    }
    let cancelled = false;
    exchangeCode(code, state)
      .then(() => {
        if (cancelled) return;
        const returnTo =
          state && state.includes(":")
            ? state.slice(state.indexOf(":") + 1) || "/workbench"
            : "/workbench";
        router.replace(returnTo.startsWith("/") ? returnTo : "/workbench");
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-frost px-6">
      <div className="glass max-w-md px-8 py-10 text-center">
        {error ? (
          <>
            <div className="font-display text-[16px] font-bold text-danger">登录失败</div>
            <p className="mt-2 text-[13px] text-slate">{error}</p>
            <a href="/" className="mt-4 inline-block text-[13px] font-medium text-primary hover:underline">
              返回工作区选择
            </a>
          </>
        ) : (
          <>
            <div className="font-display text-[16px] font-bold text-ink">正在完成 Casdoor 登录…</div>
            <p className="mt-2 text-[13px] text-muted">授权码换票中，请稍候</p>
          </>
        )}
      </div>
    </div>
  );
}
