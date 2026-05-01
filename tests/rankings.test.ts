import { describe, expect, it } from "vitest";
import { demoSnapshot } from "@/lib/demo-data";
import { buildCircuitPoints, computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { validateImportRows } from "@/lib/normalize";
import type { ImportRow } from "@/lib/types";

describe("rankings", () => {
  it("asigna puntos solo segun puestos top 10", () => {
    const points = buildCircuitPoints(demoSnapshot);
    const firstPlace = points.find((point) => point.place === 1);
    const tenthPlaceScore = demoSnapshot.pointRules.find((rule) => rule.place === 10)?.points;

    expect(firstPlace?.points).toBe(12);
    expect(tenthPlaceScore).toBe(3);
  });

  it("aplica desempate por mejor resultado reciente", () => {
    const rows = computeIndividualRankings(demoSnapshot, {
      categoryId: "sub-10",
      branchId: "absoluto",
    });

    expect(rows[0].playerName).toBe("Diego Acosta");
    expect(rows[0].totalPoints).toBe(23);
    expect(rows[1].playerName).toBe("Mateo Silva");
    expect(rows[1].totalPoints).toBe(23);
  });

  it("suma colegios automaticamente", () => {
    const rows = computeSchoolRankings(demoSnapshot);

    expect(rows[0].schoolName).toBe("Colegio San Jose");
    expect(rows[0].totalPoints).toBeGreaterThan(0);
    expect(rows[0].playersWithPoints).toBeGreaterThan(1);
  });
});

describe("validateImportRows", () => {
  it("detecta puestos duplicados y colegios vacios", () => {
    const rows: ImportRow[] = [
      row("a", 1, "Ana Rojas", ""),
      row("b", 1, "Ana Rojaz", "Colegio Santa Maria"),
    ];

    const issues = validateImportRows(rows);

    expect(issues.some((issue) => issue.type === "duplicate-place")).toBe(true);
    expect(issues.some((issue) => issue.type === "missing-school")).toBe(true);
    expect(issues.some((issue) => issue.type === "similar-player")).toBe(true);
  });
});

function row(tempId: string, place: number, playerName: string, schoolName: string): ImportRow {
  return {
    tempId,
    place,
    playerName,
    schoolName,
    tournamentPoints: 5,
    tieBreaks: {},
    raw: {},
    detected: { place: true, player: true, school: Boolean(schoolName) },
    warnings: [],
  };
}
