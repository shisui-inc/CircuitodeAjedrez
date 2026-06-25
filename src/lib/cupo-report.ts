import { getBranchName, getCategoryName } from "@/lib/circuit";
import { buildCircuitPoints, computeSchoolRankings } from "@/lib/rankings";
import { normalizeText } from "@/lib/normalize";
import type { ExportSection, ExportSheet } from "@/lib/exporters";
import type { BranchId, CategoryId, CircuitPoint, CircuitSnapshot } from "@/lib/types";

type TopPlayerBySchool = {
  playerId: string;
  playerName: string;
  totalPoints: number;
  firstPlaces: number;
  podiums: number;
  datesPlayed: number;
};

const EXCLUDED_CATEGORIES = new Set<CategoryId>(["sub-6"]);

export function buildCupoSudamericanoSheet(snapshot: CircuitSnapshot): ExportSheet {
  const eligibleCategories = snapshot.categories
    .filter((category) => !EXCLUDED_CATEGORIES.has(category.id))
    .toSorted((a, b) => a.sortOrder - b.sortOrder);
  const branches = snapshot.branches.toSorted((a, b) => a.sortOrder - b.sortOrder);
  const points = buildCircuitPoints(snapshot);
  const sections: ExportSection[] = [
    buildRegulationSection(),
    buildSummarySection(snapshot, eligibleCategories.map((category) => category.id), branches.map((branch) => branch.id)),
    ...eligibleCategories.flatMap((category) =>
      branches.map((branch) => buildCategoryBranchSection(snapshot, points, category.id, branch.id)),
    ),
  ].filter((section) => section.rows.length > 0);

  return {
    sheetName: "Cupo sudamericano acumulado",
    title: "Cupo sudamericano acumulado - Control interno",
    sections,
  };
}

function buildRegulationSection(): ExportSection {
  return {
    title: "Criterio reglamentario aplicado",
    headers: ["Punto", "Detalle"],
    rows: [
      ["Cupo por categoria", "Se considera el colegio con mayor acumulado en la categoria y rama especifica."],
      ["Alumno sugerido", "Dentro de cada colegio se muestra el jugador que mas puntos aporto en esa misma categoria y rama."],
      ["Sub 6", "No se incluye porque el reglamento indica que Sub 6 es promocional y no disputa cupo."],
      [
        "Renuncia o imposibilidad",
        "Si el jugador no puede usar el cupo, pasa al 2do mejor colegio ubicado en esa categoria; no al siguiente jugador de la misma institucion.",
      ],
      ["Uso", "Documento de control interno."],
    ],
    tone: "blue",
  };
}

function buildSummarySection(
  snapshot: CircuitSnapshot,
  categoryIds: CategoryId[],
  branchIds: BranchId[],
): ExportSection {
  const rows = categoryIds.flatMap((categoryId) =>
    branchIds.map((branchId) => {
      const schools = computeSchoolRankings(snapshot, { categoryId, branchId });
      const topSchool = schools[0];
      const secondSchool = schools[1];
      const topPlayer = topSchool ? getTopPlayerForSchool(snapshot, categoryId, branchId, topSchool.schoolId) : null;
      const secondPlayer = secondSchool
        ? getTopPlayerForSchool(snapshot, categoryId, branchId, secondSchool.schoolId)
        : null;

      return [
        getCategoryName(categoryId),
        getBranchName(branchId),
        topSchool ? ordinal(topSchool.rank) : "",
        topSchool?.schoolName ?? "Sin puntos",
        topSchool?.totalPoints ?? 0,
        topPlayer?.playerName ?? "",
        topPlayer?.totalPoints ?? "",
        secondSchool ? ordinal(secondSchool.rank) : "",
        secondSchool?.schoolName ?? "",
        secondSchool?.totalPoints ?? "",
        secondPlayer?.playerName ?? "",
        secondPlayer?.totalPoints ?? "",
        topSchool
          ? "Titular segun acumulado de colegio; suplencia institucional corresponde al 2do colegio."
          : "Sin resultados con puntos.",
      ];
    }),
  );

  return {
    title: "Resumen de colegios con mejor acumulado por categoria y rama",
    headers: [
      "Categoria",
      "Rama",
      "Puesto colegio titular",
      "Colegio titular",
      "Puntos colegio titular",
      "Jugador que mas sumo del titular",
      "Puntos jugador titular",
      "Puesto colegio alterno",
      "Colegio alterno",
      "Puntos colegio alterno",
      "Jugador que mas sumo del alterno",
      "Puntos jugador alterno",
      "Observacion",
    ],
    rows,
    tone: "cyan",
  };
}

function buildCategoryBranchSection(
  snapshot: CircuitSnapshot,
  points: CircuitPoint[],
  categoryId: CategoryId,
  branchId: BranchId,
): ExportSection {
  const schools = computeSchoolRankings(snapshot, { categoryId, branchId });
  const rows = schools.map((school) => {
    const topPlayer = getTopPlayerForSchool(snapshot, categoryId, branchId, school.schoolId, points);

    return [
      ordinal(school.rank),
      school.schoolName,
      school.totalPoints,
      school.playersWithPoints,
      school.datesWithPoints,
      topPlayer?.playerName ?? "",
      topPlayer?.totalPoints ?? "",
      topPlayer?.firstPlaces ?? "",
      topPlayer?.podiums ?? "",
      topPlayer?.datesPlayed ?? "",
      school.rank === 1
        ? "Colegio titular del cupo"
        : school.rank === 2
          ? "Alterno si el titular no puede hacer usufructo del cupo"
          : "",
    ];
  });

  return {
    title: `Detalle - Categoria ${getCategoryName(categoryId)} - ${getBranchName(branchId)}`,
    headers: [
      "Puesto colegio",
      "Colegio",
      "Puntos colegio",
      "Alumnos con puntos",
      "Fechas con puntos",
      "Jugador que mas sumo del colegio",
      "Puntos jugador",
      "Primeros jugador",
      "Podios jugador",
      "Fechas jugador",
      "Nota",
    ],
    rows,
    tone: branchId === "femenino" ? "pink" : "cyan",
  };
}

function getTopPlayerForSchool(
  snapshot: CircuitSnapshot,
  categoryId: CategoryId,
  branchId: BranchId,
  schoolId: string,
  providedPoints?: CircuitPoint[],
): TopPlayerBySchool | null {
  const points = providedPoints ?? buildCircuitPoints(snapshot);
  const playerById = new Map(snapshot.players.map((player) => [player.id, player]));
  const resultById = new Map(snapshot.importedResults.map((result) => [result.id, result]));
  const grouped = new Map<string, TopPlayerBySchool>();

  points
    .filter(
      (point) => point.categoryId === categoryId && point.branchId === branchId && point.schoolId === schoolId,
    )
    .forEach((point) => {
      const result = resultById.get(point.importedResultId);
      const player = playerById.get(point.playerId);

      if (!result) {
        return;
      }

      const playerName = player?.fullName ?? result.playerName;
      const key = normalizeText(playerName) || point.playerId;
      const current =
        grouped.get(key) ??
        ({
          playerId: point.playerId,
          playerName,
          totalPoints: 0,
          firstPlaces: 0,
          podiums: 0,
          datesPlayed: 0,
        } satisfies TopPlayerBySchool);

      current.totalPoints += point.points;
      current.firstPlaces += point.place === 1 ? 1 : 0;
      current.podiums += point.place <= 3 ? 1 : 0;
      current.datesPlayed = new Set([
        ...Object.keys(getPlayerPointsByDate(snapshot, categoryId, branchId, schoolId, key, points)),
        point.tournamentId,
      ]).size;
      current.playerId = point.playerId;
      current.playerName = playerName;
      grouped.set(key, current);
    });

  return [...grouped.values()].sort(compareTopPlayers)[0] ?? null;
}

function getPlayerPointsByDate(
  snapshot: CircuitSnapshot,
  categoryId: CategoryId,
  branchId: BranchId,
  schoolId: string,
  normalizedPlayerName: string,
  points: CircuitPoint[],
) {
  const playerById = new Map(snapshot.players.map((player) => [player.id, player]));
  const resultById = new Map(snapshot.importedResults.map((result) => [result.id, result]));
  const pointsByDate: Record<string, number> = {};

  for (const point of points) {
    const result = resultById.get(point.importedResultId);
    const playerName = normalizeText(playerById.get(point.playerId)?.fullName ?? result?.playerName ?? "");

    if (
      point.categoryId === categoryId &&
      point.branchId === branchId &&
      point.schoolId === schoolId &&
      playerName === normalizedPlayerName
    ) {
      pointsByDate[point.tournamentId] = (pointsByDate[point.tournamentId] ?? 0) + point.points;
    }
  }

  return pointsByDate;
}

function compareTopPlayers(a: TopPlayerBySchool, b: TopPlayerBySchool) {
  return (
    b.totalPoints - a.totalPoints ||
    b.firstPlaces - a.firstPlaces ||
    b.podiums - a.podiums ||
    b.datesPlayed - a.datesPlayed ||
    a.playerName.localeCompare(b.playerName, "es")
  );
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
