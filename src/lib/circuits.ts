import type { Circuit, CircuitSnapshot } from "@/lib/types";

export const LEGACY_CIRCUIT_ID = "circuito-paranaense-2026";

export const LEGACY_CIRCUIT: Circuit = {
  id: LEGACY_CIRCUIT_ID,
  slug: "circuito-paranaense-2026",
  name: "Circuito Escolar de Ajedrez Paranaense",
  shortName: "Paranaense 2026",
  season: "2026",
  location: "Ciudad del Este, Paraguay",
  description: "Circuito escolar organizado por categorias y ramas, con resultados acumulados por fecha.",
  categoryScheme: "pares",
  modality: "presencial",
  status: "finalizado",
  isPublished: true,
  startsAt: "2026-03-14",
  endsAt: "2026-05-09",
  createdAt: "2026-03-14T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

export function withCircuitStats(circuit: Circuit, snapshot: CircuitSnapshot): Circuit {
  return {
    ...circuit,
    tournamentCount: snapshot.dates.length,
    playerCount: new Set(snapshot.importedResults.map((result) => result.playerId)).size,
    resultCount: snapshot.importedResults.length,
  };
}

export function slugifyCircuitName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}
