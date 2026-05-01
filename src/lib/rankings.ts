import { getCircuitPoints } from "@/lib/circuit";
import type {
  CircuitPoint,
  CircuitSnapshot,
  DashboardSummary,
  IndividualRankingRow,
  RankingFilters,
  SchoolRankingRow,
} from "@/lib/types";

export function buildCircuitPoints(snapshot: CircuitSnapshot): CircuitPoint[] {
  return snapshot.importedResults
    .map((result) => {
      const points = getCircuitPoints(result.place, snapshot.pointRules);

      if (!result.place || points <= 0) {
        return null;
      }

      return {
        id: `points-${result.id}`,
        importedResultId: result.id,
        tournamentId: result.tournamentId,
        categoryId: result.categoryId,
        branchId: result.branchId,
        playerId: result.playerId,
        schoolId: result.schoolId,
        place: result.place,
        points,
      };
    })
    .filter((point): point is CircuitPoint => Boolean(point));
}

export function computeIndividualRankings(
  snapshot: CircuitSnapshot,
  filters: RankingFilters = {},
): IndividualRankingRow[] {
  const circuitPoints = buildCircuitPoints(snapshot);
  const schoolById = new Map(snapshot.schools.map((school) => [school.id, school]));
  const playerById = new Map(snapshot.players.map((player) => [player.id, player]));
  const dateById = new Map(snapshot.dates.map((date) => [date.id, date]));
  const categoryFilter = filters.categoryId ?? "general";
  const branchFilter = filters.branchId ?? "general";

  const scopedResults = snapshot.importedResults.filter((result) => {
    const categoryMatches = categoryFilter === "general" || result.categoryId === categoryFilter;
    const branchMatches = branchFilter === "general" || result.branchId === branchFilter;
    return categoryMatches && branchMatches;
  });

  const pointsByResult = new Map(circuitPoints.map((point) => [point.importedResultId, point]));
  const grouped = new Map<string, IndividualRankingRow>();

  for (const result of scopedResults) {
    const player = playerById.get(result.playerId);
    const school = schoolById.get(result.schoolId);

    if (!player || !school) {
      continue;
    }

    const rowKey = `${result.playerId}-${categoryFilter}-${branchFilter}`;
    const current =
      grouped.get(rowKey) ??
      ({
        rank: 0,
        playerId: result.playerId,
        playerName: player.fullName,
        schoolId: result.schoolId,
        schoolName: school.officialName,
        categoryId: categoryFilter,
        branchId: branchFilter,
        totalPoints: 0,
        firstPlaces: 0,
        podiums: 0,
        datesPlayed: 0,
        recentBestPlace: null,
        pointsByDate: {},
        bestPlace: null,
      } satisfies IndividualRankingRow);

    const point = pointsByResult.get(result.id);
    const datePoints = point?.points ?? 0;
    current.totalPoints += datePoints;
    current.pointsByDate[result.tournamentId] = (current.pointsByDate[result.tournamentId] ?? 0) + datePoints;

    if (result.place === 1) {
      current.firstPlaces += 1;
    }

    if (result.place && result.place <= 3) {
      current.podiums += 1;
    }

    if (result.place) {
      current.bestPlace = current.bestPlace ? Math.min(current.bestPlace, result.place) : result.place;
    }

    grouped.set(rowKey, current);
  }

  for (const row of grouped.values()) {
    const playerResults = scopedResults.filter((result) => result.playerId === row.playerId);
    row.datesPlayed = new Set(playerResults.map((result) => result.tournamentId)).size;
    row.recentBestPlace = getRecentBestPlace(playerResults, dateById);
  }

  return withRanks([...grouped.values()].sort(compareIndividualRows));
}

export function computeSchoolRankings(snapshot: CircuitSnapshot): SchoolRankingRow[] {
  const circuitPoints = buildCircuitPoints(snapshot);
  const schoolById = new Map(snapshot.schools.map((school) => [school.id, school]));
  const grouped = new Map<string, SchoolRankingRow>();

  for (const point of circuitPoints) {
    const school = schoolById.get(point.schoolId);

    if (!school) {
      continue;
    }

    const current =
      grouped.get(point.schoolId) ??
      ({
        rank: 0,
        schoolId: point.schoolId,
        schoolName: school.officialName,
        totalPoints: 0,
        firstPlaces: 0,
        podiums: 0,
        datesWithPoints: 0,
        playersWithPoints: 0,
        pointsByDate: {},
      } satisfies SchoolRankingRow);

    current.totalPoints += point.points;
    current.pointsByDate[point.tournamentId] = (current.pointsByDate[point.tournamentId] ?? 0) + point.points;

    if (point.place === 1) {
      current.firstPlaces += 1;
    }

    if (point.place <= 3) {
      current.podiums += 1;
    }

    grouped.set(point.schoolId, current);
  }

  for (const row of grouped.values()) {
    const schoolPoints = circuitPoints.filter((point) => point.schoolId === row.schoolId);
    row.datesWithPoints = new Set(schoolPoints.map((point) => point.tournamentId)).size;
    row.playersWithPoints = new Set(schoolPoints.map((point) => point.playerId)).size;
  }

  return withRanks([...grouped.values()].sort(compareSchoolRows));
}

export function summarizeDashboard(snapshot: CircuitSnapshot): DashboardSummary {
  const individualRankings = computeIndividualRankings(snapshot);
  const schoolRankings = computeSchoolRankings(snapshot);

  return {
    totalPlayers: snapshot.players.length,
    totalSchools: snapshot.schools.length,
    completedDates: snapshot.dates.filter((date) => date.status !== "pendiente").length,
    importedResults: snapshot.importedResults.length,
    topPlayer: individualRankings[0],
    topSchool: schoolRankings[0],
  };
}

export function getDateChartData(snapshot: CircuitSnapshot) {
  const circuitPoints = buildCircuitPoints(snapshot);

  return snapshot.dates.map((date) => ({
    name: date.name,
    puntos: circuitPoints
      .filter((point) => point.tournamentId === date.id)
      .reduce((sum, point) => sum + point.points, 0),
    resultados: snapshot.importedResults.filter((result) => result.tournamentId === date.id).length,
  }));
}

function compareIndividualRows(a: IndividualRankingRow, b: IndividualRankingRow) {
  return (
    b.totalPoints - a.totalPoints ||
    b.firstPlaces - a.firstPlaces ||
    b.podiums - a.podiums ||
    b.datesPlayed - a.datesPlayed ||
    compareRecentPlace(a.recentBestPlace, b.recentBestPlace) ||
    a.playerName.localeCompare(b.playerName, "es")
  );
}

function compareSchoolRows(a: SchoolRankingRow, b: SchoolRankingRow) {
  return (
    b.totalPoints - a.totalPoints ||
    b.firstPlaces - a.firstPlaces ||
    b.podiums - a.podiums ||
    b.datesWithPoints - a.datesWithPoints ||
    a.schoolName.localeCompare(b.schoolName, "es")
  );
}

function compareRecentPlace(a: number | null, b: number | null) {
  if (a === b) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return a - b;
}

function withRanks<T extends { rank: number; totalPoints: number }>(rows: T[]) {
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function getRecentBestPlace(
  results: Array<{ tournamentId: string; place: number | null }>,
  dateById: Map<string, { round: number }>,
) {
  const sorted = [...results].sort((a, b) => {
    const roundA = dateById.get(a.tournamentId)?.round ?? 0;
    const roundB = dateById.get(b.tournamentId)?.round ?? 0;
    return roundB - roundA;
  });

  return sorted.find((result) => result.place !== null)?.place ?? null;
}
