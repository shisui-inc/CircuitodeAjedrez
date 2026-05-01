import { NextRequest } from "next/server";
import { validateImportRows } from "@/lib/normalize";
import { hasAdminSession } from "@/lib/server/auth";
import { confirmMixedImport } from "@/lib/server/repository";
import type { ImportPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const payload = (await request.json()) as Omit<ImportPayload, "branchId">;
  const rows = payload.rows ?? [];
  const issues = validateImportRows(rows);
  const pendingBranchRows = rows.filter((row) => row.branchId !== "absoluto" && row.branchId !== "femenino");

  if (!payload.tournamentId || !payload.categoryId) {
    return Response.json({ error: "Seleccione fecha y categoria." }, { status: 400 });
  }

  if (pendingBranchRows.length) {
    return Response.json(
      {
        error: "Asigne rama a todos los jugadores antes de confirmar.",
        issues,
        pendingBranchRows: pendingBranchRows.map((row) => row.tempId),
      },
      { status: 422 },
    );
  }

  const blockingIssues = issues.filter((issue) => issue.severity === "error");
  if (blockingIssues.length) {
    return Response.json(
      {
        error: "Corrija los errores antes de confirmar.",
        issues,
      },
      { status: 422 },
    );
  }

  const result = await confirmMixedImport(payload, "admin");
  return Response.json({ ...result, issues });
}
