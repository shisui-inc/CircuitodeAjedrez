import { BRANCHES, CATEGORIES, DEFAULT_POINT_RULES } from "@/lib/circuit";
import type { CircuitSnapshot } from "@/lib/types";

export const demoSnapshot: CircuitSnapshot = {
  categories: CATEGORIES,
  branches: BRANCHES,
  dates: [
    { id: "fecha-1", name: "Fecha 1", round: 1, date: "2026-03-14", status: "pendiente" },
    { id: "fecha-2", name: "Fecha 2", round: 2, date: "2026-04-11", status: "pendiente" },
    { id: "fecha-3", name: "Fecha 3", round: 3, date: "2026-05-09", status: "pendiente" },
  ],
  schools: [],
  players: [],
  importedResults: [],
  pointRules: DEFAULT_POINT_RULES,
  auditLogs: [],
};
