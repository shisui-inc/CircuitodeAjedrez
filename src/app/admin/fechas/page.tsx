import { DateOperations } from "@/components/date-operations";
import { getCircuitSnapshot, getSelectedCircuit } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function DatesPage() {
  const circuit = await getSelectedCircuit();
  const snapshot = await getCircuitSnapshot(circuit.id);
  return <DateOperations circuit={circuit} dates={snapshot.dates.toSorted((a, b) => a.round - b.round)} categories={snapshot.categories} branches={snapshot.branches} results={snapshot.importedResults} />;
}
