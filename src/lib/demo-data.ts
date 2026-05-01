import { BRANCHES, CATEGORIES, DEFAULT_POINT_RULES } from "@/lib/circuit";
import type { CircuitSnapshot } from "@/lib/types";

export const demoSnapshot: CircuitSnapshot = {
  categories: CATEGORIES,
  branches: BRANCHES,
  dates: [
    { id: "fecha-1", name: "Fecha 1", round: 1, date: "2026-03-14", status: "pendiente" },
    { id: "fecha-2", name: "Fecha 2", round: 2, date: "2026-04-11", status: "pendiente" },
    { id: "fecha-3", name: "Fecha 3", round: 3, date: "2026-05-09", status: "pendiente" },
    { id: "fecha-4", name: "Fecha 4", round: 4, date: "2026-06-13", status: "pendiente" },
    { id: "fecha-5", name: "Fecha 5", round: 5, date: "2026-07-11", status: "pendiente" },
    { id: "fecha-6", name: "Fecha 6", round: 6, date: "2026-08-08", status: "pendiente" },
    { id: "fecha-7", name: "Fecha 7", round: 7, date: "2026-09-12", status: "pendiente" },
    { id: "fecha-8", name: "Fecha 8", round: 8, date: "2026-10-10", status: "pendiente" },
    { id: "fecha-9", name: "Fecha 9", round: 9, date: "2026-11-14", status: "pendiente" },
    { id: "fecha-10", name: "Fecha 10", round: 10, date: "2026-12-12", status: "pendiente" },
    { id: "fecha-11", name: "Fecha 11", round: 11, date: "2027-01-09", status: "pendiente" },
    { id: "fecha-12", name: "Fecha 12", round: 12, date: "2027-02-13", status: "pendiente" },
  ],
  schools: [],
  players: [],
  importedResults: [],
  pointRules: DEFAULT_POINT_RULES,
  auditLogs: [],
};
