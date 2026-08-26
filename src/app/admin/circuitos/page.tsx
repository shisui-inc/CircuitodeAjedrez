import { CircuitManager } from "@/components/circuit-manager";
import { getCircuitCatalog, getCircuitSnapshot, getSelectedCircuit } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function CircuitsAdminPage() {
  const [circuits, selectedCircuit] = await Promise.all([getCircuitCatalog(), getSelectedCircuit()]);
  const snapshot = await getCircuitSnapshot(selectedCircuit.id);
  return <CircuitManager circuits={circuits} selectedCircuit={selectedCircuit} dates={snapshot.dates.toSorted((a, b) => a.round - b.round)} />;
}
