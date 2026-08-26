import { TournamentSettings } from "@/components/tournament-settings";
import { getCircuitSnapshot, getSelectedCircuit } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function TournamentSettingsPage() {
  const circuit = await getSelectedCircuit();
  const snapshot = await getCircuitSnapshot(circuit.id);

  return (
    <TournamentSettings
      circuit={circuit}
      categories={snapshot.categories.map((category) => category.name)}
      resultCount={snapshot.importedResults.length}
    />
  );
}
