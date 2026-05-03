import { NextResponse } from "next/server";
import {
  DEMO_ADMIN_COOKIE,
  getConfiguredAdminPassword,
  getDemoAdminCookieValue,
  isDemoLoginEnabled,
  verifyAdminPassword,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!isDemoLoginEnabled()) {
    return Response.json({ error: "El acceso demo esta deshabilitado." }, { status: 403 });
  }

  if (!getConfiguredAdminPassword()) {
    return Response.json({ error: "Falta configurar ADMIN_PASSWORD en Vercel." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => ({}))) as { password?: string };

  if (!verifyAdminPassword(payload.password ?? "")) {
    return Response.json({ error: "Contrasena incorrecta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_ADMIN_COOKIE, getDemoAdminCookieValue()!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
