const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");

if (!fs.existsSync(envPath)) {
  console.error("Error: no se encontro .env.local.");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: faltan NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const cases = [
  {
    label: "sub10_genevro_isaac_vega",
    sourceId: "1a154463-2d86-426b-aa68-d69d6ec7b195",
    targetId: "d35dfe93-c77b-48bc-92ce-755be8e02efb",
  },
  {
    label: "sub12_barbara_gimenez_toledo",
    sourceId: "30840bb1-e466-45bb-bb5e-9e49fea932eb",
    targetId: "4ca997b0-d102-4e24-a874-3b6dedf393d0",
  },
  {
    label: "abierto_garcia_saulo_junior",
    sourceId: "ba950066-4cb6-421c-833b-4e7fa478a879",
    targetId: "25bec278-3724-490b-a0a9-222a1dc27ce0",
  },
  {
    label: "abierto_femenino_vazquez_fleitas_pilar",
    sourceId: "f1a44be3-ad35-444b-a2cb-a8e2de66a3b7",
    targetId: "f8a309c3-0d25-4eb2-bfd7-9e720a305cf3",
  },
  {
    label: "sub10_paredes_arias_jhon_john",
    sourceId: "53acb755-f6db-41e3-86f2-cdaacafd2cba",
    targetId: "20f18cc2-b0a4-4876-8400-b4675c0e66ca",
  },
];

const jacqueline = {
  label: "sub6_to_sub8_fleitas_silvero_jacqueline",
  sourceId: "9b1aebff-d49f-4642-b401-893702a15638",
  targetId: "dfd2fba0-77fc-4e65-8ac4-9ddef199a512",
  resultId: "7f933af5-cdf7-4ea6-bdec-efce68aaccf6",
  targetCategoryId: "sub-8",
  targetPlace: 6,
};

async function selectOrThrow(query) {
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function getPointRules() {
  const rows = await selectOrThrow(supabase.from("point_rules").select("place,points"));
  return new Map(rows.map((row) => [row.place, row.points]));
}

async function getPlayers(playerIds) {
  if (!playerIds.length) {
    return [];
  }

  return selectOrThrow(
    supabase
      .from("players")
      .select("id,full_name,normalized_name,school_id,branch_id,birth_year,created_at,updated_at")
      .in("id", playerIds),
  );
}

async function getResults(playerIds) {
  if (!playerIds.length) {
    return [];
  }

  return selectOrThrow(
    supabase
      .from("imported_results")
      .select("*")
      .in("player_id", playerIds)
      .order("tournament_id"),
  );
}

async function getPoints(resultIds) {
  if (!resultIds.length) {
    return [];
  }

  return selectOrThrow(supabase.from("circuit_points").select("*").in("imported_result_id", resultIds));
}

function findConflicts(results, sourceId, targetId) {
  const sourceScopes = new Set(
    results
      .filter((result) => result.player_id === sourceId)
      .map((result) => `${result.tournament_id}/${result.category_id}/${result.branch_id}`),
  );

  return Array.from(
    new Set(
      results
        .filter((result) => result.player_id === targetId)
        .map((result) => `${result.tournament_id}/${result.category_id}/${result.branch_id}`)
        .filter((scope) => sourceScopes.has(scope)),
    ),
  );
}

async function assertMergeIsSafe(sourceId, targetId, label) {
  const results = await getResults([sourceId, targetId]);
  const conflicts = findConflicts(results, sourceId, targetId);

  if (conflicts.length) {
    throw new Error(`${label}: conflicto de fusion en ${conflicts.join(", ")}.`);
  }
}

async function assertDestinationPlaceIsFree(result, categoryId, place) {
  const rows = await selectOrThrow(
    supabase.from("imported_results").select("id,player_name_snapshot").match({
      tournament_id: result.tournament_id,
      category_id: categoryId,
      branch_id: result.branch_id,
      place,
    }),
  );

  const conflict = rows.find((row) => row.id !== result.id);
  if (conflict) {
    throw new Error(
      `Destino ocupado para ${result.tournament_id}/${categoryId}/${result.branch_id}/puesto ${place}: ${conflict.player_name_snapshot}`,
    );
  }
}

async function updateOrThrow(query) {
  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

async function mergePlayers(source, target, label) {
  await assertMergeIsSafe(source.id, target.id, label);

  const sourceResults = await getResults([source.id]);
  await updateOrThrow(
    supabase
      .from("imported_results")
      .update({
        player_id: target.id,
        player_name_snapshot: target.full_name,
      })
      .eq("player_id", source.id),
  );

  await updateOrThrow(
    supabase.from("circuit_points").update({ player_id: target.id }).eq("player_id", source.id),
  );

  await updateOrThrow(supabase.from("players").delete().eq("id", source.id));

  return {
    label,
    source: source.full_name,
    target: target.full_name,
    movedResults: sourceResults.length,
  };
}

async function moveJacqueline(source, target, pointRules) {
  const [result] = await selectOrThrow(
    supabase.from("imported_results").select("*").eq("id", jacqueline.resultId),
  );

  if (!result) {
    throw new Error("No se encontro el resultado de Jacqueline Maite en sub-6.");
  }

  if (result.player_id !== source.id) {
    throw new Error("El resultado de Jacqueline Maite no pertenece al jugador origen esperado.");
  }

  await assertDestinationPlaceIsFree(result, jacqueline.targetCategoryId, jacqueline.targetPlace);

  await updateOrThrow(
    supabase
      .from("imported_results")
      .update({
        category_id: jacqueline.targetCategoryId,
        place: jacqueline.targetPlace,
        player_id: target.id,
        school_id: target.school_id,
        player_name_snapshot: target.full_name,
      })
      .eq("id", result.id),
  );

  await updateOrThrow(
    supabase
      .from("circuit_points")
      .update({
        category_id: jacqueline.targetCategoryId,
        place: jacqueline.targetPlace,
        points: pointRules.get(jacqueline.targetPlace) ?? 0,
        player_id: target.id,
        school_id: target.school_id,
      })
      .eq("imported_result_id", result.id),
  );

  await updateOrThrow(supabase.from("players").delete().eq("id", source.id));

  return {
    label: jacqueline.label,
    source: source.full_name,
    target: target.full_name,
    movedResults: 1,
    movedTo: {
      tournamentId: result.tournament_id,
      categoryId: jacqueline.targetCategoryId,
      branchId: result.branch_id,
      place: jacqueline.targetPlace,
    },
  };
}

async function writeBackup(players) {
  const results = await getResults(players.map((player) => player.id));
  const points = await getPoints(results.map((result) => result.id));
  const payload = {
    createdAt: new Date().toISOString(),
    players,
    results,
    points,
  };
  const file = path.join(__dirname, "../.data/correccion-duplicados-2026-06-27.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
  return file;
}

async function run() {
  const playerIds = Array.from(
    new Set([
      ...cases.flatMap((item) => [item.sourceId, item.targetId]),
      jacqueline.sourceId,
      jacqueline.targetId,
    ]),
  );
  const players = await getPlayers(playerIds);
  const playersById = new Map(players.map((player) => [player.id, player]));
  const missingIds = playerIds.filter((id) => !playersById.has(id));

  if (missingIds.length) {
    throw new Error(`No se encontraron jugadores: ${missingIds.join(", ")}`);
  }

  const backupFile = await writeBackup(players);
  const pointRules = await getPointRules();
  const applied = [];

  for (const item of cases) {
    applied.push(await mergePlayers(playersById.get(item.sourceId), playersById.get(item.targetId), item.label));
  }

  applied.push(
    await moveJacqueline(playersById.get(jacqueline.sourceId), playersById.get(jacqueline.targetId), pointRules),
  );

  await updateOrThrow(
    supabase.from("audit_logs").insert({
      action: "db.player_corrections",
      entity_type: "database",
      actor_email: "admin",
      summary: "Correcciones de duplicados y categoria aplicadas: Genevro, Jacqueline, Barbara, Saulo, Vazquez y Paredes.",
      metadata: {
        appliedAt: new Date().toISOString(),
        backupFile,
        cases: applied,
      },
    }),
  );

  console.log(JSON.stringify({ backupFile, applied }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
