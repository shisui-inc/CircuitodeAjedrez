import { NextRequest } from "next/server";
import { validateImportRows } from "@/lib/normalize";
import { hasAdminSession } from "@/lib/server/auth";
import { confirmImport } from "@/lib/server/repository";
import type { ImportPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const payload = (await request.json()) as ImportPayload;
  const issues = validateImportRows(payload.rows ?? []);
  const blockingIssues = issues.filter((issue) => issue.severity === "error");

  if (!payload.tournamentId || !payload.categoryId || !payload.branchId) {
    return Response.json({ error: "Seleccione fecha, categoria y rama." }, { status: 400 });
  }

  if (blockingIssues.length) {
    return Response.json(
      {
        error: "Corrija los errores antes de confirmar.",
        issues,
      },
      { status: 422 },
    );
  }

  const result = await confirmImport(payload, "admin");
  return Response.json({ ...result, issues });
}
