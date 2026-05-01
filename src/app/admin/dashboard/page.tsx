import { CalendarDays, School, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateActivityChart, SchoolPointsChart } from "@/components/dashboard-charts";
import { StatCard } from "@/components/stat-card";
import { getDateChartData, computeSchoolRankings, summarizeDashboard } from "@/lib/rankings";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await getCircuitSnapshot();
  const summary = summarizeDashboard(snapshot);
  const schoolRankings = computeSchoolRankings(snapshot);
  const chartData = getDateChartData(snapshot);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Vista rapida del circuito, cargas confirmadas y lideres actuales.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Jugadores" value={summary.totalPlayers} helper="Con ID interno" icon={Users} tone="blue" />
        <StatCard title="Colegios" value={summary.totalSchools} helper="Con alias disponibles" icon={School} tone="emerald" />
        <StatCard title="Fechas importadas" value={summary.completedDates} helper="Clasificaciones guardadas" icon={CalendarDays} tone="amber" />
        <StatCard title="Resultados" value={summary.importedResults} helper="Filas de torneos" icon={Trophy} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Puntos por fecha</CardTitle>
            <CardDescription>Total de puntos adjudicados por cada fecha importada.</CardDescription>
          </CardHeader>
          <CardContent>
            <DateActivityChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Colegios lideres</CardTitle>
            <CardDescription>Primeros colegios por acumulado general.</CardDescription>
          </CardHeader>
          <CardContent>
            <SchoolPointsChart rows={schoolRankings} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Lider individual</CardTitle>
            <CardDescription>Ranking general con desempates del circuito.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.topPlayer ? (
              <div className="flex items-center justify-between rounded-lg bg-stone-100 p-4">
                <div>
                  <p className="font-semibold">{summary.topPlayer.playerName}</p>
                  <p className="text-sm text-muted-foreground">{summary.topPlayer.schoolName}</p>
                </div>
                <Badge>{summary.topPlayer.totalPoints} pts</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin resultados todavia.</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Colegio lider</CardTitle>
            <CardDescription>Suma automatica de alumnos ubicados en top 10.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.topSchool ? (
              <div className="flex items-center justify-between rounded-lg bg-stone-100 p-4">
                <div>
                  <p className="font-semibold">{summary.topSchool.schoolName}</p>
                  <p className="text-sm text-muted-foreground">
                    {summary.topSchool.playersWithPoints} alumnos con puntos
                  </p>
                </div>
                <Badge>{summary.topSchool.totalPoints} pts</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin colegios puntuando todavia.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
