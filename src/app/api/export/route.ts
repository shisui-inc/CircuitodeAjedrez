import { NextRequest } from "next/server";
import { computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { toCsv, toXlsxBuffer, type ExportSheet } from "@/lib/exporters";
import { getCircuitSnapshot } from "@/lib/server/repository";
import type { BranchId, CategoryId } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "individual";
  const format = searchParams.get("format") ?? "csv";
  const categoryId = (searchParams.get("categoryId") ?? "general") as CategoryId | "general";
  const branchId = (searchParams.get("branchId") ?? "general") as BranchId | "general";
  const snapshot = await getCircuitSnapshot();
  const sheet = buildSheet(scope, snapshot, categoryId, branchId);

  if (format === "xlsx") {
    const buffer = await toXlsxBuffer(sheet);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${fileName(scope, "xlsx")}"`,
      },
    });
  }

  return new Response(toCsv(sheet), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName(scope, "csv")}"`,
    },
  });
}

function buildSheet(
  scope: string,
  snapshot: Awaited<ReturnType<typeof getCircuitSnapshot>>,
  categoryId: CategoryId | "general",
  branchId: BranchId | "general",
): ExportSheet {
  if (scope === "colegios") {
    const rows = computeSchoolRankings(snapshot).map((row) => [
      row.rank,
      row.schoolName,
      row.totalPoints,
      row.firstPlaces,
      row.podiums,
      row.playersWithPoints,
      row.datesWithPoints,
    ]);

    return {
      sheetName: "Ranking colegios",
      headers: ["Puesto", "Colegio", "Puntos", "Primeros", "Podios", "Alumnos", "Fechas"],
      rows,
    };
  }

  const rows = computeIndividualRankings(snapshot, { categoryId, branchId }).map((row) => [
    row.rank,
    row.playerName,
    row.schoolName,
    row.totalPoints,
    row.firstPlaces,
    row.podiums,
    row.datesPlayed,
    row.recentBestPlace ?? "",
  ]);

  return {
    sheetName: "Ranking individual",
    headers: ["Puesto", "Jugador", "Colegio", "Puntos", "Primeros", "Podios", "Fechas", "Ultimo mejor puesto"],
    rows,
  };
}

function fileName(scope: string, extension: "csv" | "xlsx") {
  const label = scope === "colegios" ? "ranking-colegios" : "ranking-individual";
  return `${label}.${extension}`;
}
