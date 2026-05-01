import { normalizeText, similarityRatio } from "@/lib/normalize";
import type { BranchId, ImportRow, Player } from "@/lib/types";

const FEMALE_NAME_HINTS = new Set([
  "abril",
  "adriana",
  "agustina",
  "alessandra",
  "alexandra",
  "alicia",
  "alma",
  "amanda",
  "ana",
  "andrea",
  "angela",
  "antonella",
  "araceli",
  "ariana",
  "beatriz",
  "belen",
  "bianca",
  "camila",
  "carla",
  "carmen",
  "carolina",
  "catalina",
  "cecilia",
  "clara",
  "claudia",
  "daniela",
  "delfina",
  "elena",
  "elisa",
  "emilia",
  "emma",
  "estefania",
  "eugenia",
  "fatima",
  "fernanda",
  "fiorella",
  "florencia",
  "francesca",
  "gabriela",
  "giovanna",
  "guadalupe",
  "isabel",
  "isabella",
  "jazmin",
  "josefina",
  "juana",
  "juliana",
  "julieta",
  "laura",
  "leticia",
  "lourdes",
  "lucia",
  "luisa",
  "luna",
  "maia",
  "malena",
  "maria",
  "mariana",
  "martina",
  "micaela",
  "milagros",
  "miranda",
  "natalia",
  "paola",
  "paula",
  "renata",
  "romina",
  "sabrina",
  "samanta",
  "samantha",
  "sofia",
  "valentina",
  "valeria",
  "veronica",
  "victoria",
  "violeta",
  "ximena",
  "zaira",
  "zoe",
]);

const FEMALE_BRANCH_VALUES = new Set(["f", "w", "woman", "women", "female", "fem", "femenino", "femenina", "damas"]);
const ABSOLUTE_BRANCH_VALUES = new Set(["m", "male", "masculino", "varon", "varones", "absoluto", "open", "general"]);
const BRANCH_HEADER_HINTS = ["sexo", "sex", "genero", "gender", "rama", "categoria", "cat"];

export function classifyImportRowBranch(row: ImportRow, players: Player[]): ImportRow {
  const explicitBranch = detectExplicitBranch(row);
  if (explicitBranch) {
    return { ...row, branchId: explicitBranch };
  }

  const normalized = normalizeText(row.playerName);
  const exact = players.find((player) => player.normalizedName === normalized && player.branchId);

  if (exact?.branchId) {
    return { ...row, branchId: exact.branchId };
  }

  const similar = players
    .map((player) => ({ player, ratio: similarityRatio(player.fullName, row.playerName) }))
    .filter(({ player, ratio }) => ratio >= 0.9 && player.branchId)
    .sort((a, b) => b.ratio - a.ratio)[0];

  if (similar?.player.branchId) {
    return {
      ...row,
      branchId: similar.player.branchId,
      warnings: [...row.warnings, `Rama sugerida por nombre parecido: ${similar.player.fullName}.`],
    };
  }

  const guessedBranch = detectBranchByFirstName(row.playerName);

  return {
    ...row,
    branchId: guessedBranch,
    warnings: [
      ...row.warnings,
      guessedBranch === "femenino"
        ? "Rama sugerida automaticamente por nombre. Confirme o cambie si corresponde."
        : "Rama sugerida como absoluto. Confirme o cambie si corresponde.",
    ],
  };
}

function detectExplicitBranch(row: ImportRow): BranchId | null {
  for (const [rawHeader, rawValue] of Object.entries(row.raw)) {
    const header = normalizeText(rawHeader);
    const value = normalizeText(String(rawValue));

    if (!value || !BRANCH_HEADER_HINTS.some((hint) => header.includes(hint))) {
      continue;
    }

    const branch = branchFromValue(value);
    if (branch) {
      return branch;
    }
  }

  const titleValue = Object.entries(row.raw).find(([rawHeader]) => {
    const header = normalizeText(rawHeader);
    return header.includes("titulo") || header.includes("tit");
  })?.[1];
  const title = normalizeText(String(titleValue ?? ""));
  if (["wcm", "wfm", "wim", "wgm"].some((candidate) => title.includes(candidate))) {
    return "femenino";
  }

  return null;
}

function branchFromValue(value: string): BranchId | null {
  const tokens = value.split(" ").filter(Boolean);
  if (tokens.some((token) => FEMALE_BRANCH_VALUES.has(token)) || value.includes("femen")) {
    return "femenino";
  }

  if (tokens.some((token) => ABSOLUTE_BRANCH_VALUES.has(token)) || value.includes("absolut")) {
    return "absoluto";
  }

  return null;
}

function detectBranchByFirstName(playerName: string): BranchId {
  const firstName = normalizeText(playerName).split(" ")[0] ?? "";
  return FEMALE_NAME_HINTS.has(firstName) ? "femenino" : "absoluto";
}
