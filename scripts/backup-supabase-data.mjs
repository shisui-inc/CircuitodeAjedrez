import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Faltan SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
}

const client = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const tables = [
  "categories",
  "branches",
  "tournaments",
  "schools",
  "school_aliases",
  "players",
  "imported_results",
  "point_rules",
  "circuit_points",
  "audit_logs",
];
const backup = {
  format: "circuitos-supabase-backup-v1",
  createdAt: new Date().toISOString(),
  sourceProjectUrl: url,
  tables: {},
};

for (const table of tables) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select("*").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  backup.tables[table] = rows;
}

const outputDirectory = path.join(process.cwd(), "outputs");
const outputPath = path.join(outputDirectory, "supabase-sofwaredelcircuito-data-backup-2026-08-26.json");
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, JSON.stringify(backup, null, 2), "utf8");

console.log(JSON.stringify({
  outputPath,
  counts: Object.fromEntries(Object.entries(backup.tables).map(([table, rows]) => [table, rows.length])),
}));
