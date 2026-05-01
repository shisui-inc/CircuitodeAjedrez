import { NextResponse } from "next/server";
import { DEMO_ADMIN_COOKIE, isDemoLoginEnabled } from "@/lib/server/auth";

export async function POST() {
  if (!isDemoLoginEnabled()) {
    return Response.json({ error: "El acceso demo esta deshabilitado." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
