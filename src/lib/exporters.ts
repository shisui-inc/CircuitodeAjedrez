type ExportCell = string | number | null | undefined;

export type ExportRowKind = "title" | "section" | "header" | "data" | "spacer";

export interface ExportSection {
  title: string;
  headers: string[];
  rows: ExportCell[][];
  tone?: "blue" | "cyan" | "pink";
}

export interface ExportSheet {
  sheetName: string;
  title?: string;
  headers?: string[];
  rows?: ExportCell[][];
  sections?: ExportSection[];
}

export function toCsv(sheet: ExportSheet) {
  const rows = flattenSheet(sheet).map((row) => row.cells);

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n");
}

export async function toXlsxBuffer(sheet: ExportSheet) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const worksheetXml = buildWorksheetXml(sheet);

  zip.file("[Content_Types].xml", contentTypesXml());
  zip.folder("_rels")?.file(".rels", rootRelsXml());
  zip.folder("xl")?.file("workbook.xml", workbookXml(sheet.sheetName));
  zip.folder("xl")?.folder("_rels")?.file("workbook.xml.rels", workbookRelsXml());
  zip.folder("xl")?.folder("worksheets")?.file("sheet1.xml", worksheetXml);
  zip.folder("xl")?.folder("styles")?.file("styles.xml", stylesXml());

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function buildWorksheetXml(sheet: ExportSheet) {
  const rows = flattenSheet(sheet);
  const maxColumns = Math.max(1, ...rows.map((row) => row.cells.length));
  const merges: string[] = [];
  const rowXml = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = padCells(row.cells, maxColumns)
        .map((cell, columnIndex) => buildCellXml(cell, columnName(columnIndex) + rowNumber, row.kind, row.tone))
        .join("");

      if ((row.kind === "title" || row.kind === "section") && maxColumns > 1) {
        merges.push(`<mergeCell ref="A${rowNumber}:${columnName(maxColumns - 1)}${rowNumber}"/>`);
      }

      return `<row r="${rowNumber}"${row.kind === "spacer" ? ' ht="12" customHeight="1"' : ""}>${cells}</row>`;
    })
    .join("");
  const colsXml = buildColsXml(maxColumns);
  const mergeXml = merges.length ? `<mergeCells count="${merges.length}">${merges.join("")}</mergeCells>` : "";

  return xmlHeader(
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${colsXml}<sheetData>${rowXml}</sheetData>${mergeXml}</worksheet>`,
  );
}

function buildCellXml(cell: ExportCell, reference: string, kind: ExportRowKind, tone?: ExportSection["tone"]) {
  const styleId = styleIdFor(kind, tone);

  if (typeof cell === "number" && Number.isFinite(cell)) {
    return `<c r="${reference}"${styleId ? ` s="${styleId}"` : ""} t="n"><v>${cell}</v></c>`;
  }

  return `<c r="${reference}"${styleId ? ` s="${styleId}"` : ""} t="inlineStr"><is><t>${escapeXml(String(cell ?? ""))}</t></is></c>`;
}

function flattenSheet(sheet: ExportSheet): Array<{ cells: ExportCell[]; kind: ExportRowKind; tone?: ExportSection["tone"] }> {
  if (sheet.sections?.length) {
    const rows: Array<{ cells: ExportCell[]; kind: ExportRowKind; tone?: ExportSection["tone"] }> = [];

    if (sheet.title) {
      rows.push({ cells: [sheet.title], kind: "title", tone: "blue" });
    }

    sheet.sections.forEach((section, index) => {
      if (index > 0) {
        rows.push({ cells: [""], kind: "spacer" });
      }

      rows.push({ cells: [section.title], kind: "section", tone: section.tone ?? "cyan" });
      rows.push({ cells: section.headers, kind: "header" });
      rows.push(...section.rows.map((cells) => ({ cells, kind: "data" as const })));
    });

    return rows;
  }

  return [
    { cells: sheet.headers ?? [], kind: "header" },
    ...(sheet.rows ?? []).map((cells) => ({ cells, kind: "data" as const })),
  ];
}

function padCells(cells: ExportCell[], maxColumns: number) {
  return [...cells, ...Array.from({ length: Math.max(0, maxColumns - cells.length) }, () => "")];
}

function buildColsXml(maxColumns: number) {
  const widths = [10, 34, 42, 12, 14, 14, 14, 18];
  const cols = Array.from({ length: maxColumns }, (_, index) => {
    const column = index + 1;
    const width = widths[index] ?? 16;
    return `<col min="${column}" max="${column}" width="${width}" customWidth="1"/>`;
  }).join("");

  return `<cols>${cols}</cols>`;
}

function styleIdFor(kind: ExportRowKind, tone?: ExportSection["tone"]) {
  if (kind === "title") {
    return 1;
  }

  if (kind === "section") {
    if (tone === "pink") {
      return 3;
    }

    return 2;
  }

  if (kind === "header") {
    return 4;
  }

  if (kind === "data") {
    return 5;
  }

  return 0;
}

function columnName(index: number) {
  let dividend = index + 1;
  let name = "";

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return name;
}

function escapeCsvCell(cell: ExportCell) {
  const value = String(cell ?? "");
  if (!/[",\r\n]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlHeader(body: string) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${body}`;
}

function contentTypesXml() {
  return xmlHeader(
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
  );
}

function rootRelsXml() {
  return xmlHeader(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );
}

function workbookXml(sheetName: string) {
  return xmlHeader(
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  );
}

function workbookRelsXml() {
  return xmlHeader(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles/styles.xml"/></Relationships>`,
  );
}

function stylesXml() {
  return xmlHeader(
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Geist"/></font><font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Geist"/></font><font><b/><sz val="11"/><name val="Geist"/></font></fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F497D"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF12A8D7"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF9999"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7F7F7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyBorder="1"/></cellXfs></styleSheet>`,
  );
}
