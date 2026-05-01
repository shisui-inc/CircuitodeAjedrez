import { NextRequest } from "next/server";
import { parseChessResultsXlsx } from "@/lib/chess-results-parser";
import { normalizeText, similarityRatio } from "@/lib/normalize";
import { hasAdminSession } from "@/lib/server/auth";
import { getCircuitSnapshot } from "@/lib/server/repository";
import type { BranchId, ImportRow } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Suba un archivo .xlsx exportado de Chess-Results." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return Response.json({ error: "El archivo debe ser .xlsx." }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "El archivo es demasiado grande. Maximo 8 MB." }, { status: 413 });
  }

  try {
    const parsed = await parseChessResultsXlsx(await file.arrayBuffer());
    const snapshot = await getCircuitSnapshot();
    const rows = parsed.rows.map((row) => assignBranch(row, snapshot.players));
    const pendingBranches = rows.filter((row) => !isBranch(row.branchId)).length;

    return Response.json({
      rows,
      warnings: [
        ...parsed.warnings,
        pendingBranches
          ? `${pendingBranches} jugadores necesitan asignacion manual de rama antes de confirmar.`
          : "",
      ].filter(Boolean),
      fileName: file.name,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo leer el archivo." },
      { status: 400 },
    );
  }
}

function assignBranch(row: ImportRow, players: Awaited<ReturnType<typeof getCircuitSnapshot>>["players"]): ImportRow {
  const normalized = normalizeText(row.playerName);
  const exact = players.find((player) => player.normalizedName === normalized && player.branchId);

  if (exact?.branchId) {
    return { ...row, branchId: exact.branchId };
  }

  const similar = players
    .map((player) => ({
      player,
      ratio: similarityRatio(player.fullName, row.playerName),
    }))
    .filter(({ player, ratio }) => ratio >= 0.9 && player.branchId)
    .sort((a, b) => b.ratio - a.ratio)[0];

  return {
    ...row,
    branchId: similar?.player.branchId ?? "pendiente",
    warnings: [
      ...row.warnings,
      similar ? `Rama sugerida por nombre parecido: ${similar.player.fullName}.` : "Rama no detectada.",
    ],
  };
}

function isBranch(value: ImportRow["branchId"]): value is BranchId {
  return value === "absoluto" || value === "femenino";
}
