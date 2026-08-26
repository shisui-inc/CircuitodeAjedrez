import type { CircuitSnapshot } from "@/lib/types";

export function filterPublishedSnapshot(snapshot: CircuitSnapshot): CircuitSnapshot {
  const publishedTournamentIds = new Set(
    snapshot.dates.filter((date) => date.status === "cerrada").map((date) => date.id),
  );
  const importedResults = snapshot.importedResults.filter((result) =>
    publishedTournamentIds.has(result.tournamentId),
  );
  const playerIds = new Set(importedResults.map((result) => result.playerId));
  const schoolIds = new Set(importedResults.map((result) => result.schoolId));

  return {
    ...snapshot,
    dates: snapshot.dates.filter((date) => publishedTournamentIds.has(date.id)),
    importedResults,
    circuitPoints: snapshot.circuitPoints?.filter((point) =>
      publishedTournamentIds.has(point.tournamentId),
    ),
    players: snapshot.players.filter((player) => playerIds.has(player.id)),
    schools: snapshot.schools.filter((school) => schoolIds.has(school.id)),
    auditLogs: [],
  };
}
