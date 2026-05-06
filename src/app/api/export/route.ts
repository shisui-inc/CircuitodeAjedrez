import { NextRequest } from "next/server";
import { getBranchName, getCategoryName } from "@/lib/circuit";
import { buildCircuitPoints, computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { toCsv, toXlsxBuffer, type ExportSection, type ExportSheet } from "@/lib/exporters";
import { getCircuitSnapshot } from "@/lib/server/repository";
import type { BranchId, CategoryId, CircuitSnapshot } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "individual";
  const report = searchParams.get("report") ?? "ranking";
  const format = searchParams.get("format") ?? "csv";
  const categoryId = (searchParams.get("categoryId") ?? "general") as CategoryId | "general";
  const branchId = (searchParams.get("branchId") ?? "general") as BranchId | "general";
  const snapshot = await getCircuitSnapshot();
  const sheet = buildSheet(scope, report, snapshot, categoryId, branchId);

  if (format === "xlsx") {
    const buffer = await toXlsxBuffer(sheet);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${fileName(scope, report, "xlsx")}"`,
      },
    });
  }

  return new Response(toCsv(sheet), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName(scope, report, "csv")}"`,
    },
  });
}

function buildSheet(
  scope: string,
  report: string,
  snapshot: Awaited<ReturnType<typeof getCircuitSnapshot>>,
  categoryId: CategoryId | "general",
  branchId: BranchId | "general",
): ExportSheet {
  if (scope === "individual" && report === "por-fecha") {
    return buildIndividualByDateSheet(snapshot);
  }

  if (scope === "individual" && report === "acumulado-categorias") {
    return buildIndividualAccumulatedSheet(snapshot);
  }

  if (scope === "colegios" && report === "por-fecha") {
    return buildSchoolsByDateSheet(snapshot);
  }

  if (scope === "colegios" && report === "acumulado-categorias") {
    return buildSchoolsAccumulatedSheet(snapshot);
  }

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

function buildIndividualByDateSheet(snapshot: CircuitSnapshot): ExportSheet {
  const pointsByResultId = new Map(buildCircuitPoints(snapshot).map((point) => [point.importedResultId, point.points]));
  const sections = snapshot.dates.flatMap((date) =>
    categoryBranchSections(snapshot, (categoryId, branchId) => {
      const rows = snapshot.importedResults
        .filter(
          (result) =>
            result.tournamentId === date.id &&
            result.categoryId === categoryId &&
            result.branchId === branchId &&
            result.place &&
            (pointsByResultId.get(result.id) ?? 0) > 0,
        )
        .sort((a, b) => (a.place ?? 9999) - (b.place ?? 9999))
        .map((result) => [
          ordinal(result.place ?? 0),
          result.playerName,
          result.schoolName,
          pointsByResultId.get(result.id) ?? 0,
        ]);

      return {
        title: `${date.name} - Categoria ${getCategoryName(categoryId)} - ${getBranchName(branchId)}`,
        headers: ["Puesto", "Nombre", "Colegio", "Puntos"],
        rows,
        tone: branchId === "femenino" ? "pink" : "cyan",
      };
    }),
  );

  return sectionedSheet("Resultados individuales por fecha", sections);
}

function buildIndividualAccumulatedSheet(snapshot: CircuitSnapshot): ExportSheet {
  const sections = categoryBranchSections(snapshot, (categoryId, branchId) => ({
    title: `Acumulado individual - Categoria ${getCategoryName(categoryId)} - ${getBranchName(branchId)}`,
    headers: ["Puesto", "Nombre", "Colegio", "Puntos"],
    rows: computeIndividualRankings(snapshot, { categoryId, branchId }).map((row) => [
      ordinal(row.rank),
      row.playerName,
      row.schoolName,
      row.totalPoints,
    ]),
    tone: branchId === "femenino" ? "pink" : "cyan",
  }));

  return sectionedSheet("Resultado individual acumulado", sections);
}

function buildSchoolsByDateSheet(snapshot: CircuitSnapshot): ExportSheet {
  const points = buildCircuitPoints(snapshot);
  const schoolById = new Map(snapshot.schools.map((school) => [school.id, school]));
  const sections = snapshot.dates.flatMap((date) =>
    categoryBranchSections(snapshot, (categoryId, branchId) => {
      const grouped = new Map<string, { schoolName: string; points: number; players: Set<string> }>();

      points
        .filter(
          (point) =>
            point.tournamentId === date.id && point.categoryId === categoryId && point.branchId === branchId,
        )
        .forEach((point) => {
          const school = schoolById.get(point.schoolId);

          if (!school) {
            return;
          }

          const current = grouped.get(point.schoolId) ?? {
            schoolName: school.officialName,
            points: 0,
            players: new Set<string>(),
          };
          current.points += point.points;
          current.players.add(point.playerId);
          grouped.set(point.schoolId, current);
        });

      const rows = withRanks(
        [...grouped.values()].sort((a, b) => b.points - a.points || a.schoolName.localeCompare(b.schoolName, "es")),
      ).map((row) => [ordinal(row.rank), row.schoolName, row.points, row.players.size]);

      return {
        title: `${date.name} - Colegios - Categoria ${getCategoryName(categoryId)} - ${getBranchName(branchId)}`,
        headers: ["Puesto", "Colegio", "Puntos", "Alumnos"],
        rows,
        tone: branchId === "femenino" ? "pink" : "cyan",
      };
    }),
  );

  return sectionedSheet("Resultados de colegios por fecha", sections);
}

function buildSchoolsAccumulatedSheet(snapshot: CircuitSnapshot): ExportSheet {
  const sections = categoryBranchSections(snapshot, (categoryId, branchId) => ({
    title: `Acumulado colegios - Categoria ${getCategoryName(categoryId)} - ${getBranchName(branchId)}`,
    headers: ["Puesto", "Colegio", "Puntos", "Alumnos", "Fechas"],
    rows: computeSchoolRankings(snapshot, { categoryId, branchId }).map((row) => [
      ordinal(row.rank),
      row.schoolName,
      row.totalPoints,
      row.playersWithPoints,
      row.datesWithPoints,
    ]),
    tone: branchId === "femenino" ? "pink" : "cyan",
  }));

  return sectionedSheet("Resultado colegios acumulado", sections);
}

function categoryBranchSections(
  snapshot: CircuitSnapshot,
  build: (categoryId: CategoryId, branchId: BranchId) => ExportSection,
) {
  return snapshot.categories
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((category) =>
      snapshot.branches
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map((branch) => build(category.id, branch.id)),
    )
    .filter((section) => section.rows.length > 0);
}

function sectionedSheet(title: string, sections: ExportSection[]): ExportSheet {
  return {
    sheetName: title,
    title,
    sections: sections.length
      ? sections
      : [
          {
            title: "Sin resultados",
            headers: ["Detalle"],
            rows: [["Todavia no hay resultados cargados para este reporte."]],
            tone: "cyan",
          },
        ],
  };
}

function withRanks<T extends { points: number }>(rows: T[]) {
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function ordinal(rank: number) {
  const suffixes: Record<number, string> = {
    1: "ro",
    2: "do",
    3: "ro",
    4: "to",
    5: "to",
    6: "to",
    7: "mo",
    8: "vo",
    9: "no",
    10: "mo",
  };

  return `${rank}${suffixes[rank] ?? "to"}`;
}

function fileName(scope: string, report: string, extension: "csv" | "xlsx") {
  const base = scope === "colegios" ? "colegios" : "individual";
  const label =
    report === "por-fecha"
      ? `resultados-${base}-por-fecha`
      : report === "acumulado-categorias"
        ? `resultados-${base}-acumulado`
        : `ranking-${base}`;
  return `${label}.${extension}`;
}
