import { NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { updatePointRules } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as { rules?: Array<{ place: number; points: number }> };
  const rules = body.rules ?? [];

  if (rules.length !== 10 || rules.some((rule) => rule.place < 1 || rule.place > 10 || rule.points < 0)) {
    return Response.json({ error: "Revise los puestos 1 al 10 y sus puntos." }, { status: 422 });
  }

  const result = await updatePointRules(rules, "admin");
  return Response.json(result);
}
