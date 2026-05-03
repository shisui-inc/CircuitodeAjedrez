import { getCircuitPoints } from "@/lib/circuit";
import { normalizeText, similarityRatio } from "@/lib/normalize";
import type { CircuitSnapshot, Player, School } from "@/lib/types";

export interface AuditIssue {
  type: string;
  severity: "error" | "warning";
  message: string;
  details?: Record<string, unknown>;
}

export interface DuplicatePlayerGroup {
  normalizedName: string;
  players: Array<Player & { schoolName: string; resultCount: number; points: number }>;
  totalResults: number;
  totalPoints: number;
}

export interface SimilarSchoolPair {
  ratio: number;
  first: School;
  second: School;
}

export interface DataAudit {
  summary: {
    issues: number;
    errors: number;
    warnings: number;
    duplicatePlayerGroups: number;
    similarSchoolPairs: number;
    importedResults: number;
    circuitPoints: number;
    expectedPointRows: number;
    totalExpectedPoints: number;
    totalMaterializedPoints: number;
  };
  issues: AuditIssue[];
  duplicatePlayerGroups: DuplicatePlayerGroup[];
  similarSchoolPairs: SimilarSchoolPair[];
  scopes: Array<{
    tournamentId: string;
    categoryId: string;
    branchId: string;
    results: number;
    expectedPoints: number;
    materializedPoints: number;
  }>;
}

export function buildDataAudit(snapshot: CircuitSnapshot): DataAudit {
  const issues: AuditIssue[] = [];
  const dateIds = new Set(snapshot.dates.map((date) => date.id));
  const categoryIds = new Set(snapshot.categories.map((category) => category.id));
  const branchIds = new Set(snapshot.branches.map((branch) => branch.id));
  const schoolById = new Map(snapshot.schools.map((school) => [school.id, school]));
  const playerById = new Map(snapshot.players.map((player) => [player.id, player]));
  const resultById = new Map(snapshot.importedResults.map((result) => [result.id, result]));
  const effectiveCircuitPoints = snapshot.circuitPoints ?? buildExpectedCircuitPoints(snapshot);
  const pointByResult = new Map(effectiveCircuitPoints.map((point) => [point.importedResultId, point]));
  const expectedPointResultIds = new Set<string>();
  const scopePlace = new Map<string, string[]>();
  const scopePlayer = new Map<string, string[]>();
  const scopes = new Map<string, { results: number; expectedPoints: number; materializedPoints: number }>();
  let totalExpectedPoints = 0;

  for (const result of snapshot.importedResults) {
    const scopeKey = `${result.tournamentId}|${result.categoryId}|${result.branchId}`;
    const scope = scopes.get(scopeKey) ?? { results: 0, expectedPoints: 0, materializedPoints: 0 };
    const expectedPoints = getCircuitPoints(result.place, snapshot.pointRules);
    scope.results += 1;
    scope.expectedPoints += expectedPoints;
    totalExpectedPoints += expectedPoints;
    scopes.set(scopeKey, scope);

    if (!dateIds.has(result.tournamentId)) {
      addIssue(issues, "error", "Fecha inexistente", `Resultado ${result.playerName} apunta a una fecha inexistente.`, {
        resultId: result.id,
        tournamentId: result.tournamentId,
      });
    }

    if (!categoryIds.has(result.categoryId)) {
      addIssue(issues, "error", "Categoria inexistente", `Resultado ${result.playerName} apunta a una categoria inexistente.`, {
        resultId: result.id,
        categoryId: result.categoryId,
      });
    }

    if (!branchIds.has(result.branchId)) {
      addIssue(issues, "error", "Rama inexistente", `Resultado ${result.playerName} apunta a una rama inexistente.`, {
        resultId: result.id,
        branchId: result.branchId,
      });
    }

    if (!playerById.has(result.playerId)) {
      addIssue(issues, "error", "Jugador inexistente", `Resultado ${result.playerName} apunta a un jugador inexistente.`, {
        resultId: result.id,
        playerId: result.playerId,
      });
    }

    if (!schoolById.has(result.schoolId)) {
      addIssue(issues, "error", "Colegio inexistente", `Resultado ${result.playerName} apunta a un colegio inexistente.`, {
        resultId: result.id,
        schoolId: result.schoolId,
      });
    }

    if (!result.place || result.place <= 0) {
      addIssue(issues, "error", "Puesto invalido", `Resultado ${result.playerName} tiene un puesto invalido.`, {
        resultId: result.id,
        place: result.place,
      });
    }

    if (result.place) {
      pushMap(scopePlace, `${scopeKey}|${result.place}`, result.id);
    }
    pushMap(scopePlayer, `${scopeKey}|${result.playerId}`, result.id);

    if (expectedPoints > 0) {
      expectedPointResultIds.add(result.id);
      const point = pointByResult.get(result.id);
      if (!point) {
        addIssue(issues, "error", "Puntos faltantes", `Falta circuit_points para ${result.playerName}.`, {
          resultId: result.id,
          expectedPoints,
        });
      } else if (
        point.tournamentId !== result.tournamentId ||
        point.categoryId !== result.categoryId ||
        point.branchId !== result.branchId ||
        point.playerId !== result.playerId ||
        point.schoolId !== result.schoolId ||
        point.place !== result.place ||
        point.points !== expectedPoints
      ) {
        addIssue(issues, "error", "Puntos incorrectos", `Los puntos guardados no coinciden para ${result.playerName}.`, {
          resultId: result.id,
          expectedPoints,
          actualPoints: point.points,
        });
      }
    }
  }

  for (const point of effectiveCircuitPoints) {
    const scopeKey = `${point.tournamentId}|${point.categoryId}|${point.branchId}`;
    const scope = scopes.get(scopeKey) ?? { results: 0, expectedPoints: 0, materializedPoints: 0 };
    scope.materializedPoints += point.points;
    scopes.set(scopeKey, scope);

    if (!resultById.has(point.importedResultId)) {
      addIssue(issues, "error", "Punto huerfano", "Existe un circuit_point sin resultado asociado.", {
        pointId: point.id,
        importedResultId: point.importedResultId,
      });
    }

    if (!expectedPointResultIds.has(point.importedResultId)) {
      addIssue(issues, "error", "Punto inesperado", "Existe un circuit_point para un resultado que no deberia puntuar.", {
        pointId: point.id,
        importedResultId: point.importedResultId,
      });
    }
  }

  addDuplicateScopeIssues(issues, scopePlace, "Puesto duplicado", "Hay dos resultados con el mismo puesto en la misma fecha/categoria/rama.");
  addDuplicateScopeIssues(
    issues,
    scopePlayer,
    "Jugador repetido en una tabla",
    "El mismo jugador aparece dos veces en la misma fecha/categoria/rama.",
  );

  for (const date of snapshot.dates) {
    const count = snapshot.importedResults.filter((result) => result.tournamentId === date.id).length;
    if (count > 0 && date.status === "pendiente") {
      addIssue(issues, "error", "Fecha pendiente con datos", `${date.name} tiene resultados pero sigue pendiente.`, {
        tournamentId: date.id,
        count,
      });
    }
    if (count === 0 && date.status !== "pendiente") {
      addIssue(issues, "warning", "Fecha marcada sin datos", `${date.name} esta marcada como cargada pero no tiene resultados.`, {
        tournamentId: date.id,
        status: date.status,
      });
    }
  }

  const duplicatePlayerGroups = findDuplicatePlayers(snapshot);
  const similarSchoolPairs = findSimilarSchools(snapshot.schools);
  const totalMaterializedPoints = effectiveCircuitPoints.reduce((sum, point) => sum + point.points, 0);
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;

  return {
    summary: {
      issues: issues.length,
      errors,
      warnings,
      duplicatePlayerGroups: duplicatePlayerGroups.length,
      similarSchoolPairs: similarSchoolPairs.length,
      importedResults: snapshot.importedResults.length,
      circuitPoints: effectiveCircuitPoints.length,
      expectedPointRows: expectedPointResultIds.size,
      totalExpectedPoints,
      totalMaterializedPoints,
    },
    issues,
    duplicatePlayerGroups,
    similarSchoolPairs,
    scopes: Array.from(scopes.entries())
      .map(([key, value]) => {
        const [tournamentId, categoryId, branchId] = key.split("|");
        return { tournamentId, categoryId, branchId, ...value };
      })
      .sort((a, b) => `${a.tournamentId}-${a.categoryId}-${a.branchId}`.localeCompare(`${b.tournamentId}-${b.categoryId}-${b.branchId}`)),
  };
}

function findDuplicatePlayers(snapshot: CircuitSnapshot): DuplicatePlayerGroup[] {
  const schoolById = new Map(snapshot.schools.map((school) => [school.id, school]));
  const resultStats = new Map<string, { resultCount: number; points: number }>();
  const byName = new Map<string, Player[]>();

  for (const result of snapshot.importedResults) {
    const stats = resultStats.get(result.playerId) ?? { resultCount: 0, points: 0 };
    stats.resultCount += 1;
    stats.points += getCircuitPoints(result.place, snapshot.pointRules);
    resultStats.set(result.playerId, stats);
  }

  for (const player of snapshot.players) {
    const key = normalizeText(player.fullName);
    if (!key) {
      continue;
    }
    pushMap(byName, key, player);
  }

  return Array.from(byName.entries())
    .filter(([, players]) => players.length > 1)
    .map(([normalizedName, players]) => {
      const enriched = players.map((player) => {
        const stats = resultStats.get(player.id) ?? { resultCount: 0, points: 0 };
        return {
          ...player,
          schoolName: schoolById.get(player.schoolId)?.officialName ?? "Sin colegio",
          resultCount: stats.resultCount,
          points: stats.points,
        };
      });

      return {
        normalizedName,
        players: enriched,
        totalResults: enriched.reduce((sum, player) => sum + player.resultCount, 0),
        totalPoints: enriched.reduce((sum, player) => sum + player.points, 0),
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalResults - a.totalResults || a.normalizedName.localeCompare(b.normalizedName, "es"));
}

function buildExpectedCircuitPoints(snapshot: CircuitSnapshot) {
  return snapshot.importedResults
    .map((result) => {
      const points = getCircuitPoints(result.place, snapshot.pointRules);
      if (!result.place || points <= 0) {
        return null;
      }

      return {
        id: `expected-${result.id}`,
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
    .filter((point): point is NonNullable<typeof point> => Boolean(point));
}

function findSimilarSchools(schools: School[]): SimilarSchoolPair[] {
  const pairs: SimilarSchoolPair[] = [];

  for (let i = 0; i < schools.length; i += 1) {
    for (let j = i + 1; j < schools.length; j += 1) {
      const first = schools[i];
      const second = schools[j];
      if (normalizeText(first.officialName) === normalizeText(second.officialName)) {
        continue;
      }

      const ratio = similarityRatio(first.officialName, second.officialName);
      if (ratio >= 0.9) {
        pairs.push({ ratio, first, second });
      }
    }
  }

  return pairs.sort((a, b) => b.ratio - a.ratio);
}

function addIssue(
  issues: AuditIssue[],
  severity: AuditIssue["severity"],
  type: string,
  message: string,
  details?: Record<string, unknown>,
) {
  issues.push({ type, severity, message, details });
}

function addDuplicateScopeIssues(issues: AuditIssue[], values: Map<string, string[]>, type: string, message: string) {
  for (const [key, resultIds] of values) {
    if (resultIds.length > 1) {
      addIssue(issues, "error", type, message, { key, resultIds });
    }
  }
}

function pushMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
  map.set(key, [...(map.get(key) ?? []), value]);
}
