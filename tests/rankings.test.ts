import { describe, expect, it } from "vitest";
import { demoSnapshot } from "@/lib/demo-data";
import { buildCircuitPoints, computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { validateImportRows } from "@/lib/normalize";
import type { CircuitSnapshot, ImportRow } from "@/lib/types";

const rankingSnapshot: CircuitSnapshot = {
  ...demoSnapshot,
  schools: [
    {
      id: "school-san-jose",
      officialName: "Colegio San Jose",
      normalizedName: "colegio san jose",
      aliases: [],
    },
    {
      id: "school-parana",
      officialName: "Colegio Parana",
      normalizedName: "colegio parana",
      aliases: [],
    },
  ],
  players: [
    {
      id: "player-mateo",
      fullName: "Mateo Silva",
      normalizedName: "mateo silva",
      schoolId: "school-san-jose",
    },
    {
      id: "player-diego",
      fullName: "Diego Acosta",
      normalizedName: "diego acosta",
      schoolId: "school-parana",
    },
    {
      id: "player-bruno",
      fullName: "Bruno Gomez",
      normalizedName: "bruno gomez",
      schoolId: "school-san-jose",
    },
  ],
  importedResults: [
    result("r1", "fecha-1", "player-mateo", "school-san-jose", "Mateo Silva", "Colegio San Jose", 1),
    result("r2", "fecha-1", "player-diego", "school-parana", "Diego Acosta", "Colegio Parana", 2),
    result("r3", "fecha-1", "player-bruno", "school-san-jose", "Bruno Gomez", "Colegio San Jose", 10),
    result("r4", "fecha-2", "player-diego", "school-parana", "Diego Acosta", "Colegio Parana", 1),
    result("r5", "fecha-2", "player-mateo", "school-san-jose", "Mateo Silva", "Colegio San Jose", 2),
  ],
};

describe("rankings", () => {
  it("asigna puntos solo segun puestos top 10", () => {
    const points = buildCircuitPoints(rankingSnapshot);
    const firstPlace = points.find((point) => point.place === 1);
    const tenthPlaceScore = rankingSnapshot.pointRules.find((rule) => rule.place === 10)?.points;

    expect(firstPlace?.points).toBe(12);
    expect(tenthPlaceScore).toBe(3);
  });

  it("aplica desempate por mejor resultado reciente", () => {
    const rows = computeIndividualRankings(rankingSnapshot, {
      categoryId: "sub-10",
      branchId: "absoluto",
    });

    expect(rows[0].playerName).toBe("Diego Acosta");
    expect(rows[0].totalPoints).toBe(23);
    expect(rows[1].playerName).toBe("Mateo Silva");
    expect(rows[1].totalPoints).toBe(23);
  });

  it("suma colegios automaticamente", () => {
    const rows = computeSchoolRankings(rankingSnapshot);

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

function result(
  id: string,
  tournamentId: string,
  playerId: string,
  schoolId: string,
  playerName: string,
  schoolName: string,
  place: number,
) {
  return {
    id,
    tournamentId,
    categoryId: "sub-10" as const,
    branchId: "absoluto" as const,
    place,
    playerId,
    schoolId,
    playerName,
    schoolName,
    tournamentPoints: 5,
    tieBreaks: {},
    rawRow: {},
    importedAt: "2026-04-11T18:30:00.000Z",
  };
}
