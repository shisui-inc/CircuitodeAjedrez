import { FileSpreadsheet, Trophy } from "lucide-react";
import { ExportActions } from "@/components/export-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Reportes / Exportar</h2>
        <p className="text-sm text-muted-foreground">Descargue rankings en CSV o XLSX para publicar, imprimir o archivar.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Trophy className="size-5" />
            </div>
            <CardTitle>Ranking individual</CardTitle>
            <CardDescription>Exporta el ranking general individual con desempates principales.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportActions scope="individual" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
              <FileSpreadsheet className="size-5" />
            </div>
            <CardTitle>Ranking colegios</CardTitle>
            <CardDescription>Exporta el acumulado por colegios y los puntos por fecha.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportActions scope="colegios" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
