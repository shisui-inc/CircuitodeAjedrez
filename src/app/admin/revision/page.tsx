import { ImportWizard } from "@/components/import-wizard";
import { getDemoImportRows } from "@/lib/chess-results-parser";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const snapshot = await getCircuitSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Revision de importacion</h2>
        <p className="text-sm text-muted-foreground">
          Pantalla de control manual para completar colegios, puestos y nombres parecidos antes de guardar.
        </p>
      </div>
      <ImportWizard
        dates={snapshot.dates}
        categories={snapshot.categories}
        branches={snapshot.branches}
        initialRows={getDemoImportRows()}
      />
    </div>
  );
}
