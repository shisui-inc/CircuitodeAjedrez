type ExportCell = string | number | null | undefined;

export interface ExportSheet {
  sheetName: string;
  headers: string[];
  rows: ExportCell[][];
}

export function toCsv(sheet: ExportSheet) {
  return [sheet.headers, ...sheet.rows]
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
  const rows = [sheet.headers, ...sheet.rows];
  const rowXml = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => buildCellXml(cell, columnName(columnIndex) + (rowIndex + 1)))
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return xmlHeader(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`);
}

function buildCellXml(cell: ExportCell, reference: string) {
  if (typeof cell === "number" && Number.isFinite(cell)) {
    return `<c r="${reference}" t="n"><v>${cell}</v></c>`;
  }

  return `<c r="${reference}" t="inlineStr"><is><t>${escapeXml(String(cell ?? ""))}</t></is></c>`;
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
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Geist"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellXfs></styleSheet>`,
  );
}
