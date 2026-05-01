import { ImportWizard } from "@/components/import-wizard";
import { getDemoImportRows } from "@/lib/chess-results-parser";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const snapshot = await getCircuitSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Importar Chess-Results</h2>
        <p className="text-sm text-muted-foreground">
          Lea una clasificacion final, revise los datos y confirme la carga para actualizar rankings.
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
