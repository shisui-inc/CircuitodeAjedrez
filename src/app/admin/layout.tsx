import { AppShell } from "@/components/app-shell";
import { getCircuitCatalog, getSelectedCircuit } from "@/lib/server/repository";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [circuits, selectedCircuit] = await Promise.all([getCircuitCatalog(), getSelectedCircuit()]);
  return <AppShell circuits={circuits} selectedCircuit={selectedCircuit}>{children}</AppShell>;
}
