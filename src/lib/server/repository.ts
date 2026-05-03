import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_POINT_RULES } from "@/lib/circuit";
import { demoSnapshot } from "@/lib/demo-data";
import { getCircuitPoints } from "@/lib/circuit";
import { normalizeText } from "@/lib/normalize";
import type {
  AuditLog,
  Branch,
  Category,
  CircuitDate,
  CircuitSnapshot,
  ImportPayload,
  ImportedResult,
  Player,
  School,
} from "@/lib/types";
import { getSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/server/supabase";

const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_SNAPSHOT_PATH = path.join(LOCAL_DATA_DIR, "circuit-snapshot.json");

function canUseLocalFileStorage() {
  return !process.env.VERCEL && process.env.NODE_ENV !== "production";
}

interface SchoolRow {
  id: string;
  official_name: string;
  normalized_name: string;
  city: string | null;
  school_aliases?: Array<{ alias: string }>;
}

interface PlayerRow {
  id: string;
  full_name: string;
  normalized_name: string;
  school_id: string;
  branch_id: Branch["id"] | null;
  birth_year: number | null;
}

interface TournamentRow {
  id: string;
  name: string;
  round: number;
  date: string;
  status: "pendiente" | "importada" | "cerrada";
  source_url: string | null;
}

interface ImportedResultRow {
  id: string;
  tournament_id: string;
  category_id: Category["id"];
  branch_id: Branch["id"];
  place: number | null;
  player_id: string;
  school_id: string;
  player_name_snapshot: string;
  school_name_snapshot: string;
  tournament_points: number;
  tie_breaks: Record<string, number | string> | null;
  source_url: string | null;
  raw_row: Record<string, string> | null;
  created_at: string;
  needs_review: boolean | null;
}

interface CircuitPointRow {
  id: string;
  imported_result_id: string;
  tournament_id: string;
  category_id: Category["id"];
  branch_id: Branch["id"];
  player_id: string;
  school_id: string;
  place: number;
  points: number;
}

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_email: string | null;
  summary: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export async function getCircuitSnapshot(): Promise<CircuitSnapshot> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getLocalSnapshot();
  }

  const [
    categoriesResponse,
    branchesResponse,
    datesResponse,
    schoolsResponse,
    playersResponse,
    resultsResponse,
    circuitPointsResponse,
    pointRulesResponse,
    auditResponse,
  ] = await Promise.all([
    supabase.from("categories").select("id,name,sort_order").order("sort_order"),
    supabase.from("branches").select("id,name,sort_order").order("sort_order"),
    supabase.from("tournaments").select("id,name,round,date,status,source_url").order("round"),
    supabase
      .from("schools")
      .select("id,official_name,normalized_name,city,school_aliases(alias)")
      .order("official_name"),
    supabase.from("players").select("id,full_name,normalized_name,school_id,branch_id,birth_year").order("full_name"),
    supabase
      .from("imported_results")
      .select(
        "id,tournament_id,category_id,branch_id,place,player_id,school_id,player_name_snapshot,school_name_snapshot,tournament_points,tie_breaks,source_url,raw_row,created_at,needs_review",
      )
      .order("place"),
    supabase
      .from("circuit_points")
      .select("id,imported_result_id,tournament_id,category_id,branch_id,player_id,school_id,place,points")
      .order("tournament_id"),
    supabase.from("point_rules").select("place,points").order("place"),
    supabase
      .from("audit_logs")
      .select("id,action,entity_type,entity_id,actor_email,summary,created_at,metadata")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const firstError = [
    categoriesResponse.error,
    branchesResponse.error,
    datesResponse.error,
    schoolsResponse.error,
    playersResponse.error,
    resultsResponse.error,
    circuitPointsResponse.error,
    pointRulesResponse.error,
    auditResponse.error,
  ].find(Boolean);

  if (firstError) {
    console.error("[repository] Supabase snapshot query failed", firstError);
    return structuredClone(demoSnapshot);
  }

  return {
    categories:
      categoriesResponse.data?.map((row) => ({
        id: row.id,
        name: row.name,
        sortOrder: row.sort_order,
      })) ?? demoSnapshot.categories,
    branches:
      branchesResponse.data?.map((row) => ({
        id: row.id,
        name: row.name,
        sortOrder: row.sort_order,
      })) ?? demoSnapshot.branches,
    dates: ((datesResponse.data ?? []) as TournamentRow[]).map(mapTournament),
    schools: ((schoolsResponse.data ?? []) as SchoolRow[]).map(mapSchool),
    players: ((playersResponse.data ?? []) as PlayerRow[]).map(mapPlayer),
    importedResults: ((resultsResponse.data ?? []) as ImportedResultRow[]).map(mapImportedResult),
    circuitPoints: ((circuitPointsResponse.data ?? []) as CircuitPointRow[]).map(mapCircuitPoint),
    pointRules: pointRulesResponse.data?.length ? pointRulesResponse.data : DEFAULT_POINT_RULES,
    auditLogs: ((auditResponse.data ?? []) as AuditRow[]).map(mapAuditLog),
  };
}

export async function confirmImport(payload: ImportPayload, actorEmail?: string) {
  const supabase = getSupabaseAdminClient();
  const replacedRows = await countExistingResults(payload.tournamentId, payload.categoryId, payload.branchId);

  if (!supabase) {
    const snapshot = await getLocalSnapshot();
    const updated = applyImportToSnapshot(snapshot, payload, actorEmail);
    await saveLocalSnapshot(updated);

    return {
      mode: "local" as const,
      savedRows: payload.rows.length,
      replacedRows,
      message: "Carga confirmada en almacenamiento local y rankings actualizados.",
    };
  }

  const scope = {
    tournament_id: payload.tournamentId,
    category_id: payload.categoryId,
    branch_id: payload.branchId,
  };

  const { error: pointsDeleteError } = await supabase.from("circuit_points").delete().match(scope);
  if (pointsDeleteError) {
    throw new Error(pointsDeleteError.message);
  }

  const { error: resultsDeleteError } = await supabase.from("imported_results").delete().match(scope);
  if (resultsDeleteError) {
    throw new Error(resultsDeleteError.message);
  }

  const resultRows = [];

  for (const row of payload.rows) {
    const school = await getOrCreateSchool(row.schoolName || "Colegio pendiente");
    const player = await getOrCreatePlayer(row.playerName, school.id, payload.branchId);

    resultRows.push({
      ...scope,
      place: row.place,
      player_id: player.id,
      school_id: school.id,
      player_name_snapshot: row.playerName,
      school_name_snapshot: school.official_name,
      tournament_points: row.tournamentPoints,
      tie_breaks: row.tieBreaks,
      source_url: payload.sourceUrl,
      raw_row: row.raw,
      needs_review: row.warnings.length > 0 || !row.detected.school || !row.detected.place,
    });

    await upsertSchoolAlias(school.id, row.schoolName);
  }

  const { data: insertedResults, error: insertError } = await supabase
    .from("imported_results")
    .insert(resultRows)
    .select("id,tournament_id,category_id,branch_id,place,player_id,school_id");

  if (insertError) {
    throw new Error(insertError.message);
  }

  const pointRows = (insertedResults ?? [])
    .map((row) => ({
      imported_result_id: row.id,
      tournament_id: row.tournament_id,
      category_id: row.category_id,
      branch_id: row.branch_id,
      player_id: row.player_id,
      school_id: row.school_id,
      place: row.place,
      points: getCircuitPoints(row.place, DEFAULT_POINT_RULES),
    }))
    .filter((row) => row.place && row.points > 0);

  if (pointRows.length) {
    const { error: pointsError } = await supabase.from("circuit_points").insert(pointRows);
    if (pointsError) {
      throw new Error(pointsError.message);
    }
  }

  const { error: tournamentUpdateError } = await supabase
    .from("tournaments")
    .update({ status: "importada", source_url: payload.sourceUrl })
    .eq("id", payload.tournamentId);
  if (tournamentUpdateError) {
    throw new Error(tournamentUpdateError.message);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "import.confirmed",
    entity_type: "imported_results",
    actor_email: actorEmail ?? "admin",
    summary: `Importacion confirmada: ${payload.rows.length} filas.`,
    metadata: {
      tournamentId: payload.tournamentId,
      categoryId: payload.categoryId,
      branchId: payload.branchId,
      sourceUrl: payload.sourceUrl,
    },
  });
  if (auditError) {
    throw new Error(auditError.message);
  }

  return {
    mode: "supabase" as const,
    savedRows: payload.rows.length,
    replacedRows,
    message: "Carga confirmada y rankings actualizados.",
  };
}

export async function updatePointRules(rules: Array<{ place: number; points: number }>, actorEmail?: string) {
  const supabase = getSupabaseAdminClient();
  const normalizedRules = rules
    .filter((rule) => rule.place >= 1 && rule.place <= 10)
    .map((rule) => ({ place: rule.place, points: rule.points }));

  if (!supabase) {
    const snapshot = await getLocalSnapshot();
    snapshot.pointRules = normalizedRules;
    snapshot.auditLogs = [
      {
        id: `audit-${randomUUID()}`,
        action: "point_rules.updated",
        entityType: "point_rules",
        actorEmail: actorEmail ?? "admin",
        summary: "Reglas de puntos actualizadas.",
        createdAt: new Date().toISOString(),
        metadata: { rules: normalizedRules },
      },
      ...snapshot.auditLogs,
    ];
    await saveLocalSnapshot(snapshot);

    return {
      mode: "local" as const,
      message: "Reglas guardadas en almacenamiento local.",
    };
  }

  const { error } = await supabase.from("point_rules").upsert(normalizedRules, { onConflict: "place" });

  if (error) {
    throw new Error(error.message);
  }

  const updateResponses = await Promise.all(
    normalizedRules.map((rule) =>
      supabase.from("circuit_points").update({ points: rule.points }).eq("place", rule.place),
    ),
  );
  const updateError = updateResponses.find((response) => response.error)?.error;
  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "point_rules.updated",
    entity_type: "point_rules",
    actor_email: actorEmail ?? "admin",
    summary: "Reglas de puntos actualizadas.",
    metadata: { rules: normalizedRules },
  });
  if (auditError) {
    throw new Error(auditError.message);
  }

  return {
    mode: "supabase" as const,
    message: "Reglas de puntos guardadas.",
  };
}

export async function correctImportedResult(
  payload: {
    resultId: string;
    place: number | null;
    branchId: Branch["id"];
    playerName: string;
    schoolName: string;
    tournamentPoints: number;
    tieBreaks: Record<string, number | string>;
  },
  actorEmail?: string,
) {
  const supabase = getSupabaseAdminClient();

  if (!payload.resultId || !payload.playerName.trim() || !payload.schoolName.trim() || !payload.branchId) {
    throw new Error("Complete jugador, colegio, rama y resultado.");
  }

  if (payload.place !== null && payload.place <= 0) {
    throw new Error("El puesto debe ser mayor a cero.");
  }

  if (!supabase) {
    const snapshot = await getLocalSnapshot();
    const result = snapshot.importedResults.find((item) => item.id === payload.resultId);

    if (!result) {
      throw new Error("Resultado no encontrado.");
    }

    const school = getOrCreateLocalSchool(snapshot, payload.schoolName);
    const player = getOrCreateLocalPlayer(snapshot, payload.playerName, school.id, payload.branchId);

    result.place = payload.place;
    result.branchId = payload.branchId;
    result.playerId = player.id;
    result.schoolId = school.id;
    result.playerName = player.fullName;
    result.schoolName = school.officialName;
    result.tournamentPoints = payload.tournamentPoints;
    result.tieBreaks = payload.tieBreaks;
    result.needsReview = false;

    snapshot.auditLogs = [
      {
        id: `audit-${randomUUID()}`,
        action: "imported_result.corrected",
        entityType: "imported_results",
        entityId: result.id,
        actorEmail: actorEmail ?? "admin",
        summary: `Resultado corregido: ${result.playerName}.`,
        createdAt: new Date().toISOString(),
        metadata: { resultId: result.id },
      },
      ...snapshot.auditLogs,
    ];

    await saveLocalSnapshot(snapshot);
    return { mode: "local" as const, message: "Resultado corregido." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("imported_results")
    .select("id,tournament_id,category_id,branch_id")
    .eq("id", payload.resultId)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Resultado no encontrado.");
  }

  const school = await getOrCreateSchool(payload.schoolName);
  const player = await getOrCreatePlayer(payload.playerName, school.id, payload.branchId);

  const { error: updateError } = await supabase
    .from("imported_results")
    .update({
      place: payload.place,
      branch_id: payload.branchId,
      player_id: player.id,
      school_id: school.id,
      player_name_snapshot: player.full_name,
      school_name_snapshot: school.official_name,
      tournament_points: payload.tournamentPoints,
      tie_breaks: payload.tieBreaks,
      needs_review: false,
    })
    .eq("id", payload.resultId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: pointsDeleteError } = await supabase
    .from("circuit_points")
    .delete()
    .eq("imported_result_id", payload.resultId);
  if (pointsDeleteError) {
    throw new Error(pointsDeleteError.message);
  }

  if (payload.place && payload.place >= 1 && payload.place <= 10) {
    const { error: pointsError } = await supabase.from("circuit_points").insert({
      imported_result_id: payload.resultId,
      tournament_id: existing.tournament_id,
      category_id: existing.category_id,
      branch_id: payload.branchId,
      player_id: player.id,
      school_id: school.id,
      place: payload.place,
      points: getCircuitPoints(payload.place, DEFAULT_POINT_RULES),
    });

    if (pointsError) {
      throw new Error(pointsError.message);
    }
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "imported_result.corrected",
    entity_type: "imported_results",
    entity_id: payload.resultId,
    actor_email: actorEmail ?? "admin",
    summary: `Resultado corregido: ${player.full_name}.`,
    metadata: { resultId: payload.resultId },
  });
  if (auditError) {
    throw new Error(auditError.message);
  }

  return { mode: "supabase" as const, message: "Resultado corregido." };
}

export async function deleteImportedDate(tournamentId: string, actorEmail?: string) {
  if (!tournamentId) {
    throw new Error("Seleccione una fecha valida.");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    const snapshot = await getLocalSnapshot();
    const deletedResults = snapshot.importedResults.filter((result) => result.tournamentId === tournamentId).length;

    snapshot.importedResults = snapshot.importedResults.filter((result) => result.tournamentId !== tournamentId);
    snapshot.dates = snapshot.dates.map((date) =>
      date.id === tournamentId ? { ...date, status: "pendiente" as const, sourceUrl: undefined } : date,
    );
    snapshot.auditLogs = [
      {
        id: `audit-${randomUUID()}`,
        action: "date_import.deleted",
        entityType: "tournaments",
        entityId: tournamentId,
        actorEmail: actorEmail ?? "admin",
        summary: `Datos cargados de la fecha eliminados: ${deletedResults} resultados.`,
        createdAt: new Date().toISOString(),
        metadata: { tournamentId, deletedResults },
      },
      ...snapshot.auditLogs,
    ];

    await saveLocalSnapshot(snapshot);

    return {
      mode: "local" as const,
      deletedResults,
      message: `Datos de la fecha eliminados: ${deletedResults} resultados.`,
    };
  }

  const { count: deletedResults, error: countError } = await supabase
    .from("imported_results")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (countError) {
    throw new Error(countError.message);
  }

  const { error: pointsError } = await supabase.from("circuit_points").delete().eq("tournament_id", tournamentId);
  if (pointsError) {
    throw new Error(pointsError.message);
  }

  const { error: resultsError } = await supabase.from("imported_results").delete().eq("tournament_id", tournamentId);
  if (resultsError) {
    throw new Error(resultsError.message);
  }

  const { error: tournamentError } = await supabase
    .from("tournaments")
    .update({ status: "pendiente", source_url: null })
    .eq("id", tournamentId);

  if (tournamentError) {
    throw new Error(tournamentError.message);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "date_import.deleted",
    entity_type: "tournaments",
    entity_id: tournamentId,
    actor_email: actorEmail ?? "admin",
    summary: `Datos cargados de la fecha eliminados: ${deletedResults ?? 0} resultados.`,
    metadata: { tournamentId, deletedResults: deletedResults ?? 0 },
  });
  if (auditError) {
    throw new Error(auditError.message);
  }

  return {
    mode: "supabase" as const,
    deletedResults: deletedResults ?? 0,
    message: `Datos de la fecha eliminados: ${deletedResults ?? 0} resultados.`,
  };
}

export async function mergePlayers(
  payload: {
    sourcePlayerId: string;
    targetPlayerId: string;
  },
  actorEmail?: string,
) {
  if (!payload.sourcePlayerId || !payload.targetPlayerId || payload.sourcePlayerId === payload.targetPlayerId) {
    throw new Error("Seleccione dos jugadores distintos para fusionar.");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    const snapshot = await getLocalSnapshot();
    const source = snapshot.players.find((player) => player.id === payload.sourcePlayerId);
    const target = snapshot.players.find((player) => player.id === payload.targetPlayerId);

    if (!source || !target) {
      throw new Error("Jugador origen o destino no encontrado.");
    }

    assertNoLocalMergeConflicts(snapshot, payload.sourcePlayerId, payload.targetPlayerId);

    let movedResults = 0;
    for (const result of snapshot.importedResults) {
      if (result.playerId === payload.sourcePlayerId) {
        result.playerId = payload.targetPlayerId;
        movedResults += 1;
      }
    }

    snapshot.players = snapshot.players.filter((player) => player.id !== payload.sourcePlayerId);
    snapshot.auditLogs = [
      {
        id: `audit-${randomUUID()}`,
        action: "player.merged",
        entityType: "players",
        entityId: payload.targetPlayerId,
        actorEmail: actorEmail ?? "admin",
        summary: `Jugador fusionado: ${source.fullName} -> ${target.fullName}.`,
        createdAt: new Date().toISOString(),
        metadata: { sourcePlayerId: source.id, targetPlayerId: target.id, movedResults },
      },
      ...snapshot.auditLogs,
    ];
    await saveLocalSnapshot(snapshot);

    return {
      mode: "local" as const,
      movedResults,
      message: `Jugador fusionado. Resultados movidos: ${movedResults}.`,
    };
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,full_name")
    .in("id", [payload.sourcePlayerId, payload.targetPlayerId]);

  if (playersError) {
    throw new Error(playersError.message);
  }

  const source = players?.find((player) => player.id === payload.sourcePlayerId);
  const target = players?.find((player) => player.id === payload.targetPlayerId);
  if (!source || !target) {
    throw new Error("Jugador origen o destino no encontrado.");
  }

  const { data: scopedResults, error: scopedResultsError } = await supabase
    .from("imported_results")
    .select("id,tournament_id,category_id,branch_id,player_id")
    .in("player_id", [payload.sourcePlayerId, payload.targetPlayerId]);

  if (scopedResultsError) {
    throw new Error(scopedResultsError.message);
  }

  const conflicts = findMergeConflicts(
    (scopedResults ?? []).map((result) => ({
      id: result.id,
      tournamentId: result.tournament_id,
      categoryId: result.category_id,
      branchId: result.branch_id,
      playerId: result.player_id,
    })),
    payload.sourcePlayerId,
    payload.targetPlayerId,
  );

  if (conflicts.length) {
    throw new Error(`No se puede fusionar: ambos jugadores tienen resultados en ${conflicts.join(", ")}.`);
  }

  const movedResults = (scopedResults ?? []).filter((result) => result.player_id === payload.sourcePlayerId).length;

  const { error: moveResultsError } = await supabase
    .from("imported_results")
    .update({ player_id: payload.targetPlayerId })
    .eq("player_id", payload.sourcePlayerId);

  if (moveResultsError) {
    throw new Error(moveResultsError.message);
  }

  const { error: movePointsError } = await supabase
    .from("circuit_points")
    .update({ player_id: payload.targetPlayerId })
    .eq("player_id", payload.sourcePlayerId);

  if (movePointsError) {
    throw new Error(movePointsError.message);
  }

  const { error: deleteError } = await supabase.from("players").delete().eq("id", payload.sourcePlayerId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    action: "player.merged",
    entity_type: "players",
    entity_id: payload.targetPlayerId,
    actor_email: actorEmail ?? "admin",
    summary: `Jugador fusionado: ${source.full_name} -> ${target.full_name}.`,
    metadata: {
      sourcePlayerId: source.id,
      targetPlayerId: target.id,
      movedResults,
    },
  });

  if (auditError) {
    throw new Error(auditError.message);
  }

  return {
    mode: "supabase" as const,
    movedResults,
    message: `Jugador fusionado. Resultados movidos: ${movedResults}.`,
  };
}

function assertNoLocalMergeConflicts(snapshot: CircuitSnapshot, sourcePlayerId: string, targetPlayerId: string) {
  const scopedResults = snapshot.importedResults
    .filter((result) => result.playerId === sourcePlayerId || result.playerId === targetPlayerId)
    .map((result) => ({
      id: result.id,
      tournamentId: result.tournamentId,
      categoryId: result.categoryId,
      branchId: result.branchId,
      playerId: result.playerId,
    }));
  const conflicts = findMergeConflicts(scopedResults, sourcePlayerId, targetPlayerId);

  if (conflicts.length) {
    throw new Error(`No se puede fusionar: ambos jugadores tienen resultados en ${conflicts.join(", ")}.`);
  }
}

function findMergeConflicts(
  results: Array<{ id: string; tournamentId: string; categoryId: string; branchId: string; playerId: string }>,
  sourcePlayerId: string,
  targetPlayerId: string,
) {
  const sourceScopes = new Set(
    results
      .filter((result) => result.playerId === sourcePlayerId)
      .map((result) => `${result.tournamentId}/${result.categoryId}/${result.branchId}`),
  );
  return Array.from(
    new Set(
      results
        .filter((result) => result.playerId === targetPlayerId)
        .map((result) => `${result.tournamentId}/${result.categoryId}/${result.branchId}`)
        .filter((scope) => sourceScopes.has(scope)),
    ),
  );
}

async function countExistingResults(tournamentId: string, categoryId: Category["id"], branchId: Branch["id"]) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    const snapshot = await getLocalSnapshot();
    return snapshot.importedResults.filter(
      (result) =>
        result.tournamentId === tournamentId &&
        result.categoryId === categoryId &&
        result.branchId === branchId,
    ).length;
  }

  const { count, error } = await supabase
    .from("imported_results")
    .select("id", { count: "exact", head: true })
    .match({
      tournament_id: tournamentId,
      category_id: categoryId,
      branch_id: branchId,
    });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function confirmMixedImport(
  payload: Omit<ImportPayload, "branchId">,
  actorEmail?: string,
) {
  const branches = ["absoluto", "femenino"] as const;
  let savedRows = 0;
  let replacedRows = 0;

  for (const branchId of branches) {
    const branchRows = payload.rows
      .filter((row) => row.branchId === branchId)
      .sort((a, b) => (a.place ?? 9999) - (b.place ?? 9999))
      .slice(0, 10)
      .map((row, index) => ({
        ...row,
        place: index + 1,
      }));

    if (!branchRows.length) {
      continue;
    }

    const result = await confirmImport(
      {
        ...payload,
        branchId,
        rows: branchRows,
      },
      actorEmail,
    );
    savedRows += branchRows.length;
    replacedRows += result.replacedRows;
  }

  return {
    mode: getSupabaseAdminClient() ? ("supabase" as const) : ("local" as const),
    savedRows,
    replacedRows,
    message: `Carga mixta confirmada: ${savedRows} puntuantes separados por rama.`,
  };
}

async function getLocalSnapshot(): Promise<CircuitSnapshot> {
  if (!canUseLocalFileStorage()) {
    return structuredClone(demoSnapshot);
  }

  try {
    const raw = await readFile(LOCAL_SNAPSHOT_PATH, "utf8");
    return JSON.parse(raw) as CircuitSnapshot;
  } catch {
    const seeded = structuredClone(demoSnapshot);
    await saveLocalSnapshot(seeded);
    return seeded;
  }
}

async function saveLocalSnapshot(snapshot: CircuitSnapshot) {
  if (!canUseLocalFileStorage()) {
    throw new Error(
      `Supabase admin no configurado (${formatSupabaseConfigStatus()}). El almacenamiento local solo esta disponible en desarrollo.`,
    );
  }

  await mkdir(LOCAL_DATA_DIR, { recursive: true });
  await writeFile(LOCAL_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

function formatSupabaseConfigStatus() {
  const status = getSupabaseAdminConfigStatus();
  const missing = [
    status.hasUrl ? "" : "NEXT_PUBLIC_SUPABASE_URL o SUPABASE_URL",
    status.hasServiceRoleKey ? "" : "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  return missing.length ? `faltan: ${missing.join(", ")}` : "variables presentes, cliente no inicializado";
}

function applyImportToSnapshot(snapshot: CircuitSnapshot, payload: ImportPayload, actorEmail?: string) {
  const importedAt = new Date().toISOString();
  const scopedResults = snapshot.importedResults.filter(
    (result) =>
      !(
        result.tournamentId === payload.tournamentId &&
        result.categoryId === payload.categoryId &&
        result.branchId === payload.branchId
      ),
  );

  const nextSnapshot = {
    ...snapshot,
    schools: [...snapshot.schools],
    players: [...snapshot.players],
    importedResults: scopedResults,
    dates: snapshot.dates.map((date) =>
      date.id === payload.tournamentId
        ? { ...date, status: "importada" as const, sourceUrl: payload.sourceUrl }
        : date,
    ),
    auditLogs: [...snapshot.auditLogs],
  };

  const rows = payload.rows.map((row) => {
    const school = getOrCreateLocalSchool(nextSnapshot, row.schoolName || "Colegio pendiente");
    const player = getOrCreateLocalPlayer(nextSnapshot, row.playerName, school.id, payload.branchId);

    return {
      id: `result-${randomUUID()}`,
      tournamentId: payload.tournamentId,
      categoryId: payload.categoryId,
      branchId: payload.branchId,
      place: row.place,
      playerId: player.id,
      schoolId: school.id,
      playerName: player.fullName,
      schoolName: school.officialName,
      tournamentPoints: row.tournamentPoints,
      tieBreaks: row.tieBreaks,
      sourceUrl: payload.sourceUrl,
      rawRow: row.raw,
      importedAt,
      needsReview: row.warnings.length > 0 || !row.detected.school || !row.detected.place,
    } satisfies ImportedResult;
  });

  nextSnapshot.importedResults = [...nextSnapshot.importedResults, ...rows];
  nextSnapshot.auditLogs = [
    {
      id: `audit-${randomUUID()}`,
      action: "import.confirmed",
      entityType: "imported_results",
      actorEmail: actorEmail ?? "admin",
      summary: `Importacion confirmada: ${payload.rows.length} filas.`,
      createdAt: importedAt,
      metadata: {
        tournamentId: payload.tournamentId,
        categoryId: payload.categoryId,
        branchId: payload.branchId,
        sourceUrl: payload.sourceUrl,
      },
    },
    ...nextSnapshot.auditLogs,
  ];

  return nextSnapshot;
}

function getOrCreateLocalSchool(snapshot: CircuitSnapshot, officialName: string) {
  const normalizedName = normalizeText(officialName);
  const found = snapshot.schools.find(
    (school) =>
      school.normalizedName === normalizedName ||
      school.aliases.some((alias) => normalizeText(alias) === normalizedName),
  );

  if (found) {
    if (!found.aliases.some((alias) => normalizeText(alias) === normalizedName)) {
      found.aliases = [...found.aliases, officialName];
    }
    return found;
  }

  const school: School = {
    id: `school-${randomUUID()}`,
    officialName: officialName.trim(),
    normalizedName,
    aliases: [officialName.trim()],
  };
  snapshot.schools.push(school);
  return school;
}

function getOrCreateLocalPlayer(
  snapshot: CircuitSnapshot,
  fullName: string,
  schoolId: string,
  branchId?: Player["branchId"] | "pendiente",
) {
  const normalizedName = normalizeText(fullName);
  const found = snapshot.players.find((player) => player.normalizedName === normalizedName);

  if (found) {
    found.schoolId = schoolId;
    if (branchId === "absoluto" || branchId === "femenino") {
      found.branchId = branchId;
    }
    return found;
  }

  const player: Player = {
    id: `player-${randomUUID()}`,
    fullName: fullName.trim(),
    normalizedName,
    schoolId,
    branchId: branchId === "absoluto" || branchId === "femenino" ? branchId : undefined,
  };
  snapshot.players.push(player);
  return player;
}

async function getOrCreateSchool(officialName: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase no configurado.");
  }

  const normalizedName = normalizeText(officialName);
  const { data, error } = await supabase
    .from("schools")
    .upsert(
      {
        official_name: officialName.trim(),
        normalized_name: normalizedName,
      },
      { onConflict: "normalized_name" },
    )
    .select("id,official_name,normalized_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as { id: string; official_name: string; normalized_name: string };
}

async function getOrCreatePlayer(fullName: string, schoolId: string, branchId?: Branch["id"]) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase no configurado.");
  }

  const normalizedName = normalizeText(fullName);
  const { data: existingPlayers, error: existingError } = await supabase
    .from("players")
    .select("id,full_name,school_id")
    .eq("normalized_name", normalizedName);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingPlayer =
    existingPlayers?.find((player) => player.school_id === schoolId) ?? existingPlayers?.[0];

  if (existingPlayer) {
    const { data, error } = await supabase
      .from("players")
      .update({
        full_name: fullName.trim(),
        school_id: schoolId,
        ...(branchId ? { branch_id: branchId } : {}),
      })
      .eq("id", existingPlayer.id)
      .select("id,full_name")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as { id: string; full_name: string };
  }

  const { data, error } = await supabase
    .from("players")
    .upsert(
      {
        full_name: fullName.trim(),
        normalized_name: normalizedName,
        school_id: schoolId,
        ...(branchId ? { branch_id: branchId } : {}),
      },
      { onConflict: "normalized_name,school_id" },
    )
    .select("id,full_name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as { id: string; full_name: string };
}

async function upsertSchoolAlias(schoolId: string, alias: string) {
  const supabase = getSupabaseAdminClient();
  const normalizedAlias = normalizeText(alias);

  if (!supabase || !normalizedAlias) {
    return;
  }

  const { error } = await supabase.from("school_aliases").upsert(
    {
      school_id: schoolId,
      alias: alias.trim(),
      normalized_alias: normalizedAlias,
    },
    { onConflict: "normalized_alias" },
  );
  if (error) {
    throw new Error(error.message);
  }
}

function mapTournament(row: TournamentRow): CircuitDate {
  return {
    id: row.id,
    name: row.name,
    round: row.round,
    date: row.date,
    status: row.status,
    sourceUrl: row.source_url ?? undefined,
  };
}

function mapSchool(row: SchoolRow): School {
  return {
    id: row.id,
    officialName: row.official_name,
    normalizedName: row.normalized_name,
    city: row.city ?? undefined,
    aliases: row.school_aliases?.map((alias) => alias.alias) ?? [],
  };
}

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    fullName: row.full_name,
    normalizedName: row.normalized_name,
    schoolId: row.school_id,
    branchId: row.branch_id ?? undefined,
    birthYear: row.birth_year ?? undefined,
  };
}

function mapImportedResult(row: ImportedResultRow): ImportedResult {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    categoryId: row.category_id,
    branchId: row.branch_id,
    place: row.place,
    playerId: row.player_id,
    schoolId: row.school_id,
    playerName: row.player_name_snapshot,
    schoolName: row.school_name_snapshot,
    tournamentPoints: row.tournament_points,
    tieBreaks: row.tie_breaks ?? {},
    sourceUrl: row.source_url ?? undefined,
    rawRow: row.raw_row ?? {},
    importedAt: row.created_at,
    needsReview: Boolean(row.needs_review),
  };
}

function mapCircuitPoint(row: CircuitPointRow) {
  return {
    id: row.id,
    importedResultId: row.imported_result_id,
    tournamentId: row.tournament_id,
    categoryId: row.category_id,
    branchId: row.branch_id,
    playerId: row.player_id,
    schoolId: row.school_id,
    place: row.place,
    points: row.points,
  };
}

function mapAuditLog(row: AuditRow): AuditLog {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    actorEmail: row.actor_email ?? undefined,
    summary: row.summary,
    createdAt: row.created_at,
    metadata: row.metadata ?? undefined,
  };
}
