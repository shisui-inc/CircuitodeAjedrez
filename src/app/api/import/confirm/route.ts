import { NextRequest } from "next/server";
import { validateImportRows } from "@/lib/normalize";
import { hasAdminSession } from "@/lib/server/auth";
import { confirmImport } from "@/lib/server/repository";
import type { ImportPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return Response.json({ error: "No autorizado." }, { status: 401 });
    }

    const payload = (await request.json()) as ImportPayload;
    const rows = payload.rows ?? [];
    const issues = validateImportRows(rows);
    const blockingIssues = issues.filter((issue) => issue.severity === "error");

    if (!payload.tournamentId || !payload.categoryId || !payload.branchId) {
      return Response.json({ error: "Seleccione fecha, categoria y rama." }, { status: 400 });
    }

    if (!rows.length) {
      return Response.json({ error: "No hay filas para confirmar." }, { status: 422 });
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
  } catch (error) {
    console.error("[api/import/confirm] failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo confirmar la carga." },
      { status: 500 },
    );
  }
}
