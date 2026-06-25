import { CalendarDays, FileSpreadsheet, Medal, School, Trophy } from "lucide-react";
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
            <div className="flex size-10 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
              <CalendarDays className="size-5" />
            </div>
            <CardTitle>Resultado individual por fecha</CardTitle>
            <CardDescription>Exporta cada fecha separada por categoria y rama con el formato de tabla.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportActions scope="individual" report="por-fecha" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-violet-50 text-violet-700">
              <Trophy className="size-5" />
            </div>
            <CardTitle>Resultado individual acumulado</CardTitle>
            <CardDescription>Exporta acumulados por categoria y rama en secciones ordenadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportActions scope="individual" report="acumulado-categorias" />
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
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
              <CalendarDays className="size-5" />
            </div>
            <CardTitle>Resultado colegios por fecha</CardTitle>
            <CardDescription>Exporta puntos de colegios por fecha, categoria y rama.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportActions scope="colegios" report="por-fecha" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <School className="size-5" />
            </div>
            <CardTitle>Resultado colegios acumulado</CardTitle>
            <CardDescription>Exporta acumulados de colegios por categoria y rama.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportActions scope="colegios" report="acumulado-categorias" />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-rose-50 text-rose-700">
              <Medal className="size-5" />
            </div>
            <CardTitle>Cupo sudamericano acumulado</CardTitle>
            <CardDescription>
              Documento interno con colegios titulares, alternos y jugadores que mas puntos aportaron por categoria y rama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportActions scope="colegios" report="cupo-sudamericano-acumulado" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
