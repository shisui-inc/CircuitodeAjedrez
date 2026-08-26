import { describe, expect, it } from "vitest";
import { demoSnapshot } from "@/lib/demo-data";
import { buildCupoSudamericanoSheet } from "@/lib/cupo-report";
import { toCsv } from "@/lib/exporters";
import { buildCircuitPoints, computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { validateImportRows } from "@/lib/normalize";
import { filterPublishedSnapshot } from "@/lib/publication";
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

  it("ubica libre al final del ranking de colegios", () => {
    const snapshot: CircuitSnapshot = {
      ...rankingSnapshot,
      schools: [
        ...rankingSnapshot.schools,
        {
          id: "school-libre",
          officialName: "Libre",
          normalizedName: "libre",
          aliases: [],
        },
      ],
      players: [
        ...rankingSnapshot.players,
        {
          id: "player-libre",
          fullName: "Jugador Libre",
          normalizedName: "jugador libre",
          schoolId: "school-libre",
        },
      ],
      importedResults: [
        ...rankingSnapshot.importedResults,
        result("r-libre-1", "fecha-1", "player-libre", "school-libre", "Jugador Libre", "Libre", 1),
        result("r-libre-2", "fecha-2", "player-libre", "school-libre", "Jugador Libre", "Libre", 1),
        result("r-libre-3", "fecha-3", "player-libre", "school-libre", "Jugador Libre", "Libre", 1),
      ],
    };

    const rows = computeSchoolRankings(snapshot);

    expect(rows.at(-1)?.schoolName).toBe("Libre");
    expect(rows.at(-1)?.totalPoints).toBeGreaterThan(rows[0].totalPoints);
  });

  it("agrupa el ranking individual por nombre aunque el jugador tenga ids distintos", () => {
    const snapshot: CircuitSnapshot = {
      ...rankingSnapshot,
      schools: [
        ...rankingSnapshot.schools,
        {
          id: "school-nuevo",
          officialName: "Colegio Nuevo",
          normalizedName: "colegio nuevo",
          aliases: [],
        },
      ],
      players: [
        ...rankingSnapshot.players,
        {
          id: "player-mateo-duplicado",
          fullName: "Mateo Silva",
          normalizedName: "mateo silva",
          schoolId: "school-nuevo",
        },
      ],
      importedResults: [
        ...rankingSnapshot.importedResults,
        result("r6", "fecha-3", "player-mateo-duplicado", "school-nuevo", "Mateo Silva", "Colegio Nuevo", 1),
      ],
    };

    const rows = computeIndividualRankings(snapshot, {
      categoryId: "sub-10",
      branchId: "absoluto",
    });
    const mateoRows = rows.filter((row) => row.playerName === "Mateo Silva");

    expect(mateoRows).toHaveLength(1);
    expect(mateoRows[0].totalPoints).toBe(35);
    expect(mateoRows[0].datesPlayed).toBe(3);
    expect(mateoRows[0].schoolName).toBe("Colegio Nuevo");
  });

  it("genera el reporte interno de cupo con titular, alterno y sin Sub 6", () => {
    const snapshot: CircuitSnapshot = {
      ...rankingSnapshot,
      schools: [
        ...rankingSnapshot.schools,
        {
          id: "school-tercero",
          officialName: "Colegio Tercero",
          normalizedName: "colegio tercero",
          aliases: [],
        },
      ],
      players: [
        ...rankingSnapshot.players,
        {
          id: "player-tercero",
          fullName: "Tercer Alumno",
          normalizedName: "tercer alumno",
          schoolId: "school-tercero",
        },
      ],
      importedResults: [
        ...rankingSnapshot.importedResults,
        result("r6", "fecha-3", "player-tercero", "school-tercero", "Tercer Alumno", "Colegio Tercero", 1),
        {
          ...result("sub6-1", "fecha-1", "player-tercero", "school-tercero", "Tercer Alumno", "Colegio Tercero", 1),
          categoryId: "sub-6",
        },
      ],
    };

    const csv = toCsv(buildCupoSudamericanoSheet(snapshot));

    expect(csv).toContain("Cupo sudamericano acumulado - Control interno");
    expect(csv).toContain("Colegio titular del cupo");
    expect(csv).toContain("Alterno si el titular no puede hacer usufructo del cupo");
    expect(csv).toContain("Diego Acosta");
    expect(csv).not.toContain("Detalle - Categoria Sub 6");
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

describe("publicación de fechas", () => {
  it("excluye del portal los resultados que siguen en revisión", () => {
    const snapshot: CircuitSnapshot = {
      ...rankingSnapshot,
      dates: rankingSnapshot.dates.map((date, index) => ({
        ...date,
        status: index === 0 ? "cerrada" as const : "importada" as const,
      })),
    };

    const published = filterPublishedSnapshot(snapshot);

    expect(published.dates).toHaveLength(1);
    expect(published.importedResults.every((result) => result.tournamentId === published.dates[0].id)).toBe(true);
    expect(published.auditLogs).toHaveLength(0);
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
