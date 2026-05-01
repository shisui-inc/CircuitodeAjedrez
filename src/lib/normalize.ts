import type { ImportRow, ValidationIssue } from "@/lib/types";

const WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bcol\b/g, "colegio"],
  [/\besc\b/g, "escuela"],
  [/\bnac\b/g, "nacional"],
  [/\bst[.]?\b/g, "san"],
  [/\bsta[.]?\b/g, "santa"],
];

export function normalizeText(value: string) {
  let normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of WORD_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseLocaleNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const cleaned = value.toString().trim().replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseInteger(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }

  if (!value) {
    return null;
  }

  const match = value.toString().match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

export function levenshteinDistance(a: string, b: string) {
  const source = normalizeText(a);
  const target = normalizeText(b);
  const matrix = Array.from({ length: source.length + 1 }, () =>
    new Array<number>(target.length + 1).fill(0),
  );

  for (let i = 0; i <= source.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= target.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= source.length; i += 1) {
    for (let j = 1; j <= target.length; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[source.length][target.length];
}

export function similarityRatio(a: string, b: string) {
  const source = normalizeText(a);
  const target = normalizeText(b);
  const maxLength = Math.max(source.length, target.length);

  if (!maxLength) {
    return 1;
  }

  return 1 - levenshteinDistance(source, target) / maxLength;
}

export function validateImportRows(rows: ImportRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const places = new Map<number, string[]>();
  const players = new Map<string, string[]>();

  for (const row of rows) {
    if (!row.place) {
      issues.push({
        type: "missing-place",
        message: `Falta puesto para ${row.playerName || "un jugador"}.`,
        rowIds: [row.tempId],
        severity: "error",
      });
    } else {
      places.set(row.place, [...(places.get(row.place) ?? []), row.tempId]);
    }

    if (!row.schoolName.trim()) {
      issues.push({
        type: "missing-school",
        message: `Falta colegio para ${row.playerName || "un jugador"}.`,
        rowIds: [row.tempId],
        severity: "error",
      });
    }

    const normalizedPlayer = normalizeText(row.playerName);
    if (normalizedPlayer) {
      players.set(normalizedPlayer, [...(players.get(normalizedPlayer) ?? []), row.tempId]);
    }
  }

  for (const [place, rowIds] of places) {
    if (rowIds.length > 1) {
      issues.push({
        type: "duplicate-place",
        message: `El puesto ${place} aparece ${rowIds.length} veces.`,
        rowIds,
        severity: "error",
      });
    }
  }

  for (const [playerName, rowIds] of players) {
    if (rowIds.length > 1) {
      issues.push({
        type: "duplicate-player",
        message: `El jugador "${playerName}" aparece repetido.`,
        rowIds,
        severity: "warning",
      });
    }
  }

  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const first = rows[i];
      const second = rows[j];

      if (!first.playerName || !second.playerName) {
        continue;
      }

      const ratio = similarityRatio(first.playerName, second.playerName);
      if (ratio >= 0.84 && normalizeText(first.playerName) !== normalizeText(second.playerName)) {
        issues.push({
          type: "similar-player",
          message: `Nombres parecidos: "${first.playerName}" y "${second.playerName}".`,
          rowIds: [first.tempId, second.tempId],
          severity: "warning",
        });
      }
    }
  }

  return issues;
}
