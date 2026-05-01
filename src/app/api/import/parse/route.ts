import { NextRequest } from "next/server";
import { parseChessResultsHtml } from "@/lib/chess-results-parser";
import { classifyImportRowBranch } from "@/lib/branch-classifier";
import { hasAdminSession } from "@/lib/server/auth";
import { getCircuitSnapshot } from "@/lib/server/repository";
import type { BranchId, ImportRow } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as { sourceUrl?: string };
  const sourceUrl = body.sourceUrl?.trim();

  if (!sourceUrl) {
    return Response.json({ error: "Pegue un link publico de Chess-Results." }, { status: 400 });
  }

  try {
    const url = new URL(sourceUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      return Response.json({ error: "El link debe comenzar con http o https." }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "user-agent": "Circuito Escolar de Ajedrez Paranaense/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Chess-Results respondio ${response.status}.`);
    }

    const html = await response.text();
    const parsed = parseChessResultsHtml(html);

    if (!parsed.rows.length) {
      return Response.json(
        {
          rows: [],
          warnings: parsed.warnings,
          error: "No se pudo detectar una tabla de clasificacion en el link.",
        },
        { status: 422 },
      );
    }

    const snapshot = await getCircuitSnapshot();
    const rows = parsed.rows.map((row) => classifyImportRowBranch(row, snapshot.players));
    const pendingBranches = rows.filter((row) => !isBranch(row.branchId)).length;
    const branchSummary = getBranchSummary(rows);

    return Response.json({
      ...parsed,
      rows,
      warnings: [
        ...parsed.warnings,
        `Ramas sugeridas: ${branchSummary.absoluto} absoluto, ${branchSummary.femenino} femenino. Revise y cambie lo necesario antes de confirmar.`,
        pendingBranches
          ? `${pendingBranches} jugadores necesitan asignacion manual de rama antes de confirmar.`
          : "",
      ].filter(Boolean),
      fallback: false,
    });
  } catch (error) {
    return Response.json(
      {
        rows: [],
        warnings: [],
        error: error instanceof Error ? error.message : "No se pudo leer el link.",
      },
      { status: 502 },
    );
  }
}

function isBranch(value: ImportRow["branchId"]): value is BranchId {
  return value === "absoluto" || value === "femenino";
}

function getBranchSummary(rows: ImportRow[]) {
  return rows.reduce(
    (summary, row) => {
      if (row.branchId === "absoluto" || row.branchId === "femenino") {
        summary[row.branchId] += 1;
      }

      return summary;
    },
    { absoluto: 0, femenino: 0 },
  );
}
