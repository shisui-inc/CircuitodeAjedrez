import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login";
  const isAuthorized = await hasAdminSession(request);

  if (isAdminRoute && !isAuthorized) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && isAuthorized) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
