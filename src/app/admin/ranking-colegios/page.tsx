import { ExportActions } from "@/components/export-actions";
import { SchoolPointsChart } from "@/components/dashboard-charts";
import { SchoolRankingTable } from "@/components/school-ranking-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeSchoolRankings } from "@/lib/rankings";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function SchoolRankingPage() {
  const snapshot = await getCircuitSnapshot();
  const rows = computeSchoolRankings(snapshot);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Ranking Colegios</h2>
          <p className="text-sm text-muted-foreground">Suma automatica de puntos obtenidos por alumnos en top 10.</p>
        </div>
        <ExportActions scope="colegios" />
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Acumulado por colegio</CardTitle>
          <CardDescription>Primeros puestos, podios y alumnos que aportaron puntos.</CardDescription>
        </CardHeader>
        <CardContent>
          <SchoolPointsChart rows={rows} />
        </CardContent>
      </Card>
      <SchoolRankingTable rows={rows} dates={snapshot.dates} />
    </div>
  );
}
