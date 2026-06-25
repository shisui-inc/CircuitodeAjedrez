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
  if (!match) {
    continue;
  }

  env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
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

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasTokens(value, tokens) {
  const normalized = normalize(value);
  return tokens.every((token) => normalized.includes(token));
}

async function getPlayers() {
  const { data, error } = await supabase.from("players").select("id,full_name,normalized_name,school_id");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getResultsByPlayerIds(playerIds) {
  if (!playerIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("imported_results")
    .select("id,tournament_id,category_id,branch_id,place,player_id,player_name_snapshot,school_id")
    .in("player_id", playerIds)
    .order("tournament_id");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function assertDestinationIsFree(result, categoryId) {
  const { data, error } = await supabase
    .from("imported_results")
    .select("id,player_name_snapshot")
    .match({
      tournament_id: result.tournament_id,
      category_id: categoryId,
      branch_id: result.branch_id,
      place: result.place,
    });

  if (error) {
    throw new Error(error.message);
  }

  const conflict = (data ?? []).find((row) => row.id !== result.id);
  if (conflict) {
    throw new Error(
      `Destino ocupado para ${result.tournament_id}/${categoryId}/${result.branch_id}/puesto ${result.place}: ${conflict.player_name_snapshot}`,
    );
  }
}

async function moveResultToPlayerAndCategory(result, targetPlayer, categoryId) {
  await assertDestinationIsFree(result, categoryId);

  const { error: resultError } = await supabase
    .from("imported_results")
    .update({
      category_id: categoryId,
      player_id: targetPlayer.id,
      player_name_snapshot: targetPlayer.full_name,
    })
    .eq("id", result.id);

  if (resultError) {
    throw new Error(resultError.message);
  }

  const { error: pointsError } = await supabase
    .from("circuit_points")
    .update({
      category_id: categoryId,
      player_id: targetPlayer.id,
    })
    .eq("imported_result_id", result.id);

  if (pointsError) {
    throw new Error(pointsError.message);
  }
}

async function moveResultsToPlayer(results, targetPlayer) {
  for (const result of results) {
    const { error: resultError } = await supabase
      .from("imported_results")
      .update({
        player_id: targetPlayer.id,
        player_name_snapshot: targetPlayer.full_name,
      })
      .eq("id", result.id);

    if (resultError) {
      throw new Error(resultError.message);
    }

    const { error: pointsError } = await supabase
      .from("circuit_points")
      .update({ player_id: targetPlayer.id })
      .eq("imported_result_id", result.id);

    if (pointsError) {
      throw new Error(pointsError.message);
    }
  }
}

async function normalizePlayerSnapshots(player) {
  const { error } = await supabase
    .from("imported_results")
    .update({ player_name_snapshot: player.full_name })
    .eq("player_id", player.id);

  if (error) {
    throw new Error(error.message);
  }
}

async function deleteResult(result) {
  const { error: pointsError } = await supabase.from("circuit_points").delete().eq("imported_result_id", result.id);

  if (pointsError) {
    throw new Error(pointsError.message);
  }

  const { error: resultError } = await supabase.from("imported_results").delete().eq("id", result.id);

  if (resultError) {
    throw new Error(resultError.message);
  }
}

async function deletePlayerIfUnused(player) {
  const { count, error: countError } = await supabase
    .from("imported_results")
    .select("id", { count: "exact", head: true })
    .eq("player_id", player.id);

  if (countError) {
    throw new Error(countError.message);
  }

  if (count && count > 0) {
    console.log(`No se elimina ${player.full_name}; todavia tiene ${count} resultado(s).`);
    return false;
  }

  const { error } = await supabase.from("players").delete().eq("id", player.id);

  if (error) {
    throw new Error(error.message);
  }

  console.log(`Jugador duplicado eliminado: ${player.full_name}`);
  return true;
}

async function insertAudit(summary, metadata) {
  const { error } = await supabase.from("audit_logs").insert({
    action: "db.duplicates_fixed",
    entity_type: "database",
    actor_email: "admin",
    summary,
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function run() {
  const players = await getPlayers();

  const sugasttiSource = players.find(
    (player) =>
      hasTokens(player.full_name, ["sugastti", "lucca"]) &&
      !hasTokens(player.full_name, ["gimenez", "fabrizio"]),
  );
  const gimenezTarget = players.find(
    (player) => hasTokens(player.full_name, ["gimenez", "lucca", "fabrizio"]) && player.id !== sugasttiSource?.id,
  );

  if (sugasttiSource && gimenezTarget) {
    const [sourceResult] = (await getResultsByPlayerIds([sugasttiSource.id])).filter(
      (result) => result.tournament_id === "fecha-5" && result.category_id === "sub-8",
    );

    if (sourceResult) {
      await moveResultToPlayerAndCategory(sourceResult, gimenezTarget, "sub-6");
      console.log("Sugastti/Lucca movido de fecha-5 sub-8 a sub-6 y unificado con el jugador de fecha-9 sub-6.");
    }

    await normalizePlayerSnapshots(gimenezTarget);
    await deletePlayerIfUnused(sugasttiSource);
  } else {
    console.log("Caso Sugastti/Lucca ya estaba corregido o no se encontraron ambos jugadores.");
  }

  const riosPlayers = players.filter((player) =>
    hasTokens(player.full_name, ["rios", "castro", "joaquin", "samuel"]),
  );
  const riosTarget =
    riosPlayers.find((player) => normalize(player.full_name) === "rios castro joaquin samuel") ?? riosPlayers[0];

  if (riosTarget) {
    const riosResults = await getResultsByPlayerIds([riosTarget.id]);
    const sub8Results = riosResults.filter((result) => result.category_id === "sub-8");

    for (const result of sub8Results) {
      await deleteResult(result);
      console.log(`Rios/Castro eliminado de sub-8: ${result.tournament_id}, puesto ${result.place}.`);
    }

    await normalizePlayerSnapshots(riosTarget);
  } else {
    console.log("Caso Rios/Castro ya estaba corregido o no se encontro el jugador.");
  }

  const samiraPlayers = players.filter((player) =>
    hasTokens(player.full_name, ["samudio", "susana"]) && (hasTokens(player.full_name, ["samira"]) || hasTokens(player.full_name, ["amira"])),
  );
  const samiraTarget =
    samiraPlayers.find((player) => normalize(player.full_name) === "samudio santacruz samira susana") ??
    samiraPlayers[0];

  if (samiraTarget) {
    const samiraSources = samiraPlayers.filter((player) => player.id !== samiraTarget.id);

    for (const source of samiraSources) {
      const sourceResults = await getResultsByPlayerIds([source.id]);
      await moveResultsToPlayer(sourceResults, samiraTarget);
      console.log(`Samira/Susana unificada: ${source.full_name} -> ${samiraTarget.full_name}.`);
      await deletePlayerIfUnused(source);
    }

    await normalizePlayerSnapshots(samiraTarget);
  } else {
    console.log("Caso Samira/Susana ya estaba corregido o no se encontraron jugadores.");
  }

  await insertAudit("Duplicados corregidos: Sugastti/Lucca, Rios/Castro y Samira/Susana Samudio.", {
    cases: ["sugastti_lucca", "rios_castro", "samira_samudio"],
    appliedAt: new Date().toISOString(),
  });

  console.log("Correcciones terminadas.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
