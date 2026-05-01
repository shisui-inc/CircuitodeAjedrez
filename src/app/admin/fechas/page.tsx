import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function DatesPage() {
  const snapshot = await getCircuitSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Fechas</h2>
        <p className="text-sm text-muted-foreground">Cada torneo del circuito se identifica como Fecha 1, Fecha 2, Fecha 3.</p>
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Calendario del circuito</CardTitle>
          <CardDescription>Estado de importacion y fuente usada para cada fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Dia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fuente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.dates.map((date) => (
                  <TableRow key={date.id}>
                    <TableCell className="font-medium">{date.name}</TableCell>
                    <TableCell>{new Intl.DateTimeFormat("es-PY").format(new Date(`${date.date}T00:00:00`))}</TableCell>
                    <TableCell>
                      <Badge variant={date.status === "pendiente" ? "secondary" : "default"}>{date.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">{date.sourceUrl ?? "Sin link"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
