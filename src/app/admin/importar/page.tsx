import { ImportWizard } from "@/components/import-wizard";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const snapshot = await getCircuitSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Cargar y revisar resultados</h2>
        <p className="text-sm text-muted-foreground">
          Suba el Excel, revise los datos detectados y guarde la carga. La fecha seguirá privada hasta que la publique.
        </p>
      </div>
      <ImportWizard
        dates={snapshot.dates}
        categories={snapshot.categories}
        branches={snapshot.branches}
        initialRows={[]}
        existingResults={snapshot.importedResults}
        initialTournamentId={date}
      />
    </div>
  );
}
