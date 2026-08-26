import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { getCircuitCatalog } from "@/lib/server/repository";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as { circuitId?: string };
  const circuits = await getCircuitCatalog();

  if (!body.circuitId || !circuits.some((circuit) => circuit.id === body.circuitId)) {
    return NextResponse.json({ error: "Circuito no válido." }, { status: 400 });
  }

  (await cookies()).set("admin-circuit-id", body.circuitId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ ok: true });
}
