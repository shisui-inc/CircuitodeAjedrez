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
