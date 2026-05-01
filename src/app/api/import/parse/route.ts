import { NextRequest } from "next/server";
import { parseChessResultsHtml } from "@/lib/chess-results-parser";
import { normalizeText, similarityRatio } from "@/lib/normalize";
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
    const rows = parsed.rows.map((row) => assignBranch(row, snapshot.players));
    const pendingBranches = rows.filter((row) => !isBranch(row.branchId)).length;

    return Response.json({
      ...parsed,
      rows,
      warnings: [
        ...parsed.warnings,
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
