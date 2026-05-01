import { load } from "cheerio";
import JSZip from "jszip";
import { parseInteger, parseLocaleNumber, normalizeText } from "@/lib/normalize";
import type { ImportRow } from "@/lib/types";

interface ParseCandidate {
  rows: ImportRow[];
  warnings: string[];
  score: number;
}

const PLACE_HEADERS = ["rk", "rank", "ranking", "puesto", "pos", "pl", "clas"];
const PLAYER_HEADERS = ["name", "nombre", "jugador", "player", "participante"];
const SCHOOL_HEADERS = [
  "club",
  "colegio",
  "escuela",
  "institucion",
  "institucion",
  "school",
  "delegacion",
  "equipo",
];
const POINT_HEADERS = ["pts", "puntos", "points", "score", "puntaje"];
const TIEBREAK_HEADERS = ["buch", "buc", "sb", "sonne", "progr", "wins", "victorias", "des"];
const MAX_REASONABLE_HEADER_CELLS = 40;

export function parseChessResultsHtml(html: string) {
  const $ = load(html);
  const candidates: ParseCandidate[] = [];
  const warnings: string[] = [];

  $("table").each((tableIndex, table) => {
    const matrix = $(table)
      .find("tr")
      .toArray()
      .map((row) =>
        $(row)
          .find("th,td")
          .map((__, cell) => cleanCell($(cell).text()))
          .get(),
      )
      .filter((row) => row.length >= 2 && row.some(Boolean));

    if (matrix.length < 2) {
      return;
    }

    const headerCandidates = matrix.slice(0, Math.min(6, matrix.length));
    for (const [headerIndex, header] of headerCandidates.entries()) {
      if (header.length > MAX_REASONABLE_HEADER_CELLS) {
        continue;
      }

      const mapping = detectHeaderMapping(header);
      if (!mapping.playerIndex && mapping.playerIndex !== 0) {
        continue;
      }

      const rows = mapRowsFromHeader(matrix.slice(headerIndex + 1), header, mapping, tableIndex);
      if (rows.length) {
        candidates.push({
          rows,
          warnings: rows.flatMap((row) => row.warnings),
          score: rows.length * 10 + scoreMapping(mapping),
        });
      }
    }

    const inferredRows = inferRows(matrix, tableIndex);
    if (inferredRows.length) {
      candidates.push({
        rows: inferredRows,
        warnings: inferredRows.flatMap((row) => row.warnings),
        score: inferredRows.length * 8,
      });
    }
  });

  const best = candidates.sort((a, b) => b.score - a.score)[0];

  if (!best) {
    return {
      rows: [] as ImportRow[],
      warnings: [
        "No se pudo detectar una tabla de clasificación. Pegue la tabla manualmente o complete los datos en revisión.",
      ],
    };
  }

  if (best.rows.some((row) => !row.detected.school)) {
    warnings.push("Algunas filas no tienen colegio detectado y requieren revisión manual.");
  }

  if (best.rows.some((row) => !row.detected.place)) {
    warnings.push("Algunas filas no tienen puesto detectado y requieren revisión manual.");
  }

  return {
    rows: best.rows,
    warnings: [...warnings, ...best.warnings.filter(Boolean)],
  };
}

export async function parseChessResultsXlsx(file: ArrayBuffer) {
  const zip = await JSZip.loadAsync(file);
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  const workbookRelsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("string");

  if (!workbookXml) {
    return {
      rows: [] as ImportRow[],
      warnings: ["El archivo no parece ser un Excel valido exportado por Chess-Results."],
    };
  }

  const sheetPath = getFirstSheetPath(workbookXml, workbookRelsXml);
  const sheetXml = await zip.file(sheetPath)?.async("string");

  if (!sheetXml) {
    return {
      rows: [] as ImportRow[],
      warnings: ["No se encontro la primera hoja del archivo Excel."],
    };
  }

  const sharedStrings = parseSharedStrings(sharedStringsXml ?? "");
  const matrix = sheetXmlToMatrix(sheetXml, sharedStrings);
  return parseMatrix(matrix);
}

function parseMatrix(matrix: string[][]) {
  const warnings: string[] = [];
  const candidates: ParseCandidate[] = [];

  const compact = matrix.filter((row) => row.length >= 2 && row.some(Boolean));
  const headerCandidates = compact.slice(0, Math.min(12, compact.length));

  for (const [headerIndex, header] of headerCandidates.entries()) {
    if (header.length > MAX_REASONABLE_HEADER_CELLS) {
      continue;
    }

    const mapping = detectHeaderMapping(header);
    if (!mapping.playerIndex && mapping.playerIndex !== 0) {
      continue;
    }

    const rows = mapRowsFromHeader(compact.slice(headerIndex + 1), header, mapping, 0);
    if (rows.length) {
      candidates.push({
        rows,
        warnings: rows.flatMap((row) => row.warnings),
        score: rows.length * 10 + scoreMapping(mapping),
      });
    }
  }

  const inferredRows = inferRows(compact, 0);
  if (inferredRows.length) {
    candidates.push({
      rows: inferredRows,
      warnings: inferredRows.flatMap((row) => row.warnings),
      score: inferredRows.length * 8,
    });
  }

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (!best) {
    return {
      rows: [] as ImportRow[],
      warnings: ["No se pudo detectar una tabla de clasificacion en el Excel."],
    };
  }

  if (best.rows.some((row) => !row.detected.school)) {
    warnings.push("Algunas filas no tienen colegio detectado y requieren revision manual.");
  }

  return {
    rows: best.rows,
    warnings: [...warnings, ...best.warnings.filter(Boolean)],
  };
}

export function getDemoImportRows(): ImportRow[] {
  return [
    demoImportRow(1, "Mateo Silva", "Col. San Jose", 5, { Buch: 18, SB: 14 }),
    demoImportRow(2, "Diego Acosta", "Colegio Nacional Parana", 4.5, { Buch: 17, SB: 12 }),
    demoImportRow(3, "Lucia Benitez", "Del Sol", 4, { Buch: 16, SB: 11 }),
    demoImportRow(4, "Bruno Gomez", "", 3.5, { Buch: 15, SB: 9 }),
    demoImportRow(5, "Valentina Meza", "Municipal de Ajedrez", 3, { Buch: 14, SB: 8 }),
  ];
}

function mapRowsFromHeader(
  dataRows: string[][],
  headers: string[],
  mapping: ReturnType<typeof detectHeaderMapping>,
  tableIndex: number,
) {
  return dataRows
    .map((cells, rowIndex) => mapRow(cells, headers, mapping, `t${tableIndex}-r${rowIndex}`))
    .filter((row): row is ImportRow => Boolean(row));
}

function inferRows(matrix: string[][], tableIndex: number) {
  return matrix
    .map((cells, rowIndex) => {
      const placeIndex = cells.findIndex((cell) => parseInteger(cell) !== null);
      const place = placeIndex >= 0 ? parseInteger(cells[placeIndex]) : null;
      const textCells = cells
        .map((cell, index) => ({ cell, index }))
        .filter(({ cell }) => cell && Number.isNaN(Number(cell.replace(",", "."))));
      const playerCandidate = textCells.find(({ index }) => index > placeIndex)?.cell ?? textCells[0]?.cell ?? "";
      const schoolCandidate =
        textCells.find(({ cell }) => cell !== playerCandidate && looksLikeSchool(cell))?.cell ??
        textCells.find(({ index }) => index > placeIndex + 1 && cells[index] !== playerCandidate)?.cell ??
        "";
      const pointsCandidate = [...cells].reverse().find((cell) => /^\d+([,.]\d+)?$/.test(cell));
      const tournamentPoints = parseLocaleNumber(pointsCandidate);

      if (!playerCandidate || (!place && !tournamentPoints)) {
        return null;
      }

      const warnings = [
        !place ? "Puesto no detectado." : "",
        !schoolCandidate ? `Colegio no detectado para ${playerCandidate}.` : "",
      ].filter(Boolean);

      return {
        tempId: `infer-t${tableIndex}-r${rowIndex}`,
        place,
        playerName: playerCandidate,
        schoolName: schoolCandidate,
        tournamentPoints,
        tieBreaks: {},
        raw: Object.fromEntries(cells.map((cell, index) => [`col_${index + 1}`, cell])),
        detected: {
          place: Boolean(place),
          player: Boolean(playerCandidate),
          school: Boolean(schoolCandidate),
        },
        warnings,
      } satisfies ImportRow;
    })
    .filter((row): row is ImportRow => Boolean(row));
}

function mapRow(
  cells: string[],
  headers: string[],
  mapping: ReturnType<typeof detectHeaderMapping>,
  tempId: string,
): ImportRow | null {
  const place = getCellNumber(cells, mapping.placeIndex, parseInteger);
  const playerName = getCell(cells, mapping.playerIndex);
  const schoolName = getCell(cells, mapping.schoolIndex);
  const tournamentPoints = getCellNumber(cells, mapping.pointsIndex, parseLocaleNumber) ?? 0;

  if (!playerName || normalizeText(playerName).includes("bye")) {
    return null;
  }

  if (!place && tournamentPoints === 0) {
    return null;
  }

  const warnings = [
    !place ? "Puesto no detectado." : "",
    !schoolName ? `Colegio no detectado para ${playerName}.` : "",
  ].filter(Boolean);

  return {
    tempId,
    place,
    playerName,
    schoolName,
    tournamentPoints,
    tieBreaks: Object.fromEntries(
      mapping.tieBreakIndexes.map((index) => [headers[index] || `Desempate ${index + 1}`, parseLocaleNumber(cells[index]) || cells[index] || ""]),
    ),
    raw: Object.fromEntries(headers.map((header, index) => [header || `col_${index + 1}`, cells[index] ?? ""])),
    detected: {
      place: Boolean(place),
      player: Boolean(playerName),
      school: Boolean(schoolName),
    },
    warnings,
  };
}

function detectHeaderMapping(headers: string[]) {
  const normalized = headers.map((header) => normalizeText(header));
  const placeIndex = findHeaderIndex(normalized, PLACE_HEADERS);
  const playerIndex = findHeaderIndex(normalized, PLAYER_HEADERS);
  const schoolIndex = findHeaderIndex(normalized, SCHOOL_HEADERS);
  const pointsIndex = findHeaderIndex(normalized, POINT_HEADERS);
  const tieBreakIndexes = normalized
    .map((header, index) => ({ header, index }))
    .filter(({ header, index }) => {
      if ([placeIndex, playerIndex, schoolIndex, pointsIndex].includes(index)) {
        return false;
      }

      return TIEBREAK_HEADERS.some((candidate) => header.includes(candidate)) || index > Math.max(pointsIndex, playerIndex);
    })
    .map(({ index }) => index);

  return {
    placeIndex,
    playerIndex,
    schoolIndex,
    pointsIndex,
    tieBreakIndexes,
  };
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  const exactIndex = headers.findIndex((header) => aliases.includes(header));
  if (exactIndex >= 0) {
    return exactIndex;
  }

  return headers.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

function scoreMapping(mapping: ReturnType<typeof detectHeaderMapping>) {
  return [mapping.placeIndex, mapping.playerIndex, mapping.schoolIndex, mapping.pointsIndex].filter((index) => index >= 0)
    .length;
}

function getCell(cells: string[], index: number) {
  return index >= 0 ? cells[index]?.trim() ?? "" : "";
}

function getCellNumber(
  cells: string[],
  index: number,
  parser: (value: string | number | null | undefined) => number | null,
) {
  return index >= 0 ? parser(cells[index]) : null;
}

function cleanCell(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function looksLikeSchool(value: string) {
  const normalized = normalizeText(value);
  return SCHOOL_HEADERS.some((header) => normalized.includes(header)) || normalized.split(" ").length >= 2;
}

function getFirstSheetPath(workbookXml: string, workbookRelsXml?: string) {
  const $ = load(workbookXml, { xmlMode: true });
  const firstSheet = $("sheet").first();
  const relId = firstSheet.attr("r:id");

  if (relId && workbookRelsXml) {
    const rels = load(workbookRelsXml, { xmlMode: true });
    const target = rels(`Relationship[Id="${relId}"]`).attr("Target");
    if (target) {
      return `xl/${target.replace(/^\/?xl\//, "")}`;
    }
  }

  return "xl/worksheets/sheet1.xml";
}

function parseSharedStrings(xml: string) {
  if (!xml) {
    return [] as string[];
  }

  const $ = load(xml, { xmlMode: true });
  return $("si")
    .toArray()
    .map((node) =>
      $(node)
        .find("t")
        .toArray()
        .map((textNode) => $(textNode).text())
        .join(""),
    );
}

function sheetXmlToMatrix(xml: string, sharedStrings: string[]) {
  const $ = load(xml, { xmlMode: true });
  const matrix: string[][] = [];

  $("sheetData row").each((_, row) => {
    const rowIndex = Number($(row).attr("r") ?? matrix.length + 1) - 1;
    const values: string[] = matrix[rowIndex] ?? [];

    $(row)
      .find("c")
      .each((__, cell) => {
        const ref = $(cell).attr("r") ?? "";
        const type = $(cell).attr("t");
        const colIndex = columnRefToIndex(ref);
        const rawValue = $(cell).find("v").first().text();
        const inlineValue = $(cell).find("is t").text();
        let value = inlineValue || rawValue;

        if (type === "s") {
          value = sharedStrings[Number(rawValue)] ?? "";
        }

        values[colIndex] = cleanCell(value);
      });

    matrix[rowIndex] = values;
  });

  return matrix.map((row) => {
    const lastIndex = row.reduce((last, value, index) => (value ? index : last), -1);
    return row.slice(0, lastIndex + 1).map((cell) => cell ?? "");
  });
}

function columnRefToIndex(ref: string) {
  const letters = ref.match(/[A-Z]+/)?.[0] ?? "A";
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function demoImportRow(
  place: number,
  playerName: string,
  schoolName: string,
  tournamentPoints: number,
  tieBreaks: Record<string, number>,
): ImportRow {
  return {
    tempId: `demo-${place}`,
    place,
    playerName,
    schoolName,
    tournamentPoints,
    tieBreaks,
    raw: {},
    detected: {
      place: true,
      player: true,
      school: Boolean(schoolName),
    },
    warnings: schoolName ? [] : [`Colegio no detectado para ${playerName}.`],
  };
}
