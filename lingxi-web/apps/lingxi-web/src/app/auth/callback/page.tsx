import { Suspense } from "react";
import AuthCallbackPage from "./callback-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-frost text-[13px] text-muted">
          正在完成 Casdoor 登录…
        </div>
      }
    >
      <AuthCallbackPage />
    </Suspense>
  );
}
