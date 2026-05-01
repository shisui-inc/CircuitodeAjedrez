import { describe, expect, it } from "vitest";
import { parseChessResultsHtml } from "@/lib/chess-results-parser";

describe("parseChessResultsHtml", () => {
  it("detecta columnas habituales de Chess-Results", () => {
    const html = `
      <table>
        <tr><th>Rk.</th><th>Nombre</th><th>Club</th><th>Pts.</th><th>Buch</th><th>SB</th></tr>
        <tr><td>1</td><td>Ana Rojas</td><td>Colegio Santa Maria</td><td>5,0</td><td>18</td><td>14</td></tr>
        <tr><td>2</td><td>Mateo Silva</td><td>Col. San Jose</td><td>4.5</td><td>17</td><td>12</td></tr>
      </table>
    `;

    const parsed = parseChessResultsHtml(html);

    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toMatchObject({
      place: 1,
      playerName: "Ana Rojas",
      schoolName: "Colegio Santa Maria",
      tournamentPoints: 5,
    });
    expect(parsed.rows[1].tieBreaks).toMatchObject({ Buch: 17, SB: 12 });
  });

  it("marca revision manual cuando falta colegio", () => {
    const html = `
      <table>
        <tr><th>Puesto</th><th>Jugador</th><th>Puntos</th></tr>
        <tr><td>1</td><td>Lucia Benitez</td><td>5</td></tr>
      </table>
    `;

    const parsed = parseChessResultsHtml(html);

    expect(parsed.rows[0].detected.school).toBe(false);
    expect(parsed.warnings.join(" ")).toContain("colegio");
  });
});
