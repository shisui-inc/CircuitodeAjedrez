import { CorrectionsPanel } from "@/components/corrections-panel";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function CorrectionsPage() {
  const snapshot = await getCircuitSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Correcciones</h2>
        <p className="text-sm text-muted-foreground">
          Use esta seccion para arreglar una carga confirmada sin volver a importar toda la tabla.
        </p>
      </div>
      <CorrectionsPanel
        dates={snapshot.dates}
        categories={snapshot.categories}
        branches={snapshot.branches}
        results={snapshot.importedResults}
      />
    </div>
  );
}
