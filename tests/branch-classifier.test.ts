import { describe, expect, it } from "vitest";
import { classifyImportRowBranch } from "@/lib/branch-classifier";
import type { ImportRow, Player } from "@/lib/types";

describe("classifyImportRowBranch", () => {
  it("usa una columna explicita de sexo cuando existe", () => {
    const classified = classifyImportRowBranch(row("Lucia Benitez", { Sexo: "F" }), []);

    expect(classified.branchId).toBe("femenino");
  });

  it("respeta la rama de un jugador conocido", () => {
    const players: Player[] = [
      {
        id: "player-1",
        fullName: "Mateo Silva",
        normalizedName: "mateo silva",
        schoolId: "school-1",
        branchId: "absoluto",
      },
    ];

    const classified = classifyImportRowBranch(row("Mateo Silva"), players);

    expect(classified.branchId).toBe("absoluto");
  });

  it("sugiere femenino por nombre cuando no hay jugador conocido", () => {
    const classified = classifyImportRowBranch(row("Ana Rojas"), []);

    expect(classified.branchId).toBe("femenino");
    expect(classified.warnings.join(" ")).toContain("Confirme");
  });

  it("sugiere absoluto por defecto cuando no hay senal femenina", () => {
    const classified = classifyImportRowBranch(row("Bruno Gomez"), []);

    expect(classified.branchId).toBe("absoluto");
  });
});

function row(playerName: string, raw: Record<string, string> = {}): ImportRow {
  return {
    tempId: playerName,
    place: 1,
    playerName,
    schoolName: "Colegio",
    tournamentPoints: 5,
    tieBreaks: {},
    raw,
    detected: { place: true, player: true, school: true },
    warnings: [],
  };
}
