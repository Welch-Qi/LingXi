import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 鉴权 / 租户 / i18n 中间件占位。
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};