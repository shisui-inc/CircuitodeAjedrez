import { createClient } from "@supabase/supabase-js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const run = promisify(exec);
const projectRef = process.argv[2];

if (!projectRef) {
  throw new Error("Uso: node scripts/restore-supabase-data.mjs <project-ref>");
}

if (!/^[a-z]{20}$/.test(projectRef)) {
  throw new Error("El project-ref de Supabase no es valido.");
}

const { stdout } = await run(
  `npx supabase projects api-keys --project-ref ${projectRef} --output json --agent no`,
  { cwd: process.cwd(), maxBuffer: 1024 * 1024 },
);
const keys = JSON.parse(stdout);
const anonKey = keys.find((key) => key.name === "anon" && key.type === "legacy")?.api_key;
const serviceRoleKey = keys.find((key) => key.name === "service_role" && key.type === "legacy")?.api_key;

if (!anonKey || !serviceRoleKey) {
  throw new Error("No se encontraron las claves legacy anon y service_role del proyecto.");
}

const projectUrl = `https://${projectRef}.supabase.co`;
const client = createClient(projectUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const backupPath = path.join(process.cwd(), "outputs", "supabase-sofwaredelcircuito-data-backup-2026-08-26.json");
const backup = JSON.parse(await readFile(backupPath, "utf8"));
const restoreOrder = [
  "categories",
  "branches",
  "point_rules",
  "tournaments",
  "schools",
  "school_aliases",
  "players",
  "imported_results",
  "circuit_points",
  "audit_logs",
];
const counts = {};

for (const table of restoreOrder) {
  const rows = backup.tables[table] ?? [];
  for (let index = 0; index < rows.length; index += 200) {
    const batch = rows.slice(index, index + 200);
    const { error } = await client.from(table).upsert(batch);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  counts[table] = rows.length;
}

const envPath = path.join(process.cwd(), ".env.local");
const currentEnv = await readFile(envPath, "utf8");
const replacements = new Map([
  ["NEXT_PUBLIC_SUPABASE_URL", projectUrl],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
]);
const seen = new Set();
const nextLines = currentEnv.replace(/\r\n/g, "\n").split("\n").map((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match || !replacements.has(match[1].trim())) return line;
  const name = match[1].trim();
  seen.add(name);
  return `${name}=${replacements.get(name)}`;
});

for (const [name, value] of replacements) {
  if (!seen.has(name)) nextLines.push(`${name}=${value}`);
}

await writeFile(envPath, `${nextLines.join("\n").replace(/\n+$/, "")}\n`, "utf8");
console.log(JSON.stringify({ projectRef, restored: counts, environmentUpdated: true }));
