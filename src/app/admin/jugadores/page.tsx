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

export default async function PlayersPage() {
  const snapshot = await getCircuitSnapshot();
  const schoolById = new Map(snapshot.schools.map((school) => [school.id, school]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Jugadores</h2>
        <p className="text-sm text-muted-foreground">Registro interno de alumnos detectados o creados durante importaciones.</p>
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Base de jugadores</CardTitle>
          <CardDescription>Cada jugador tiene ID interno y queda asociado a un colegio oficial.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead>Colegio</TableHead>
                  <TableHead>Normalizado</TableHead>
                  <TableHead className="text-right">Nacimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.fullName}</TableCell>
                    <TableCell>{schoolById.get(player.schoolId)?.officialName ?? "Sin colegio"}</TableCell>
                    <TableCell className="text-muted-foreground">{player.normalizedName}</TableCell>
                    <TableCell className="text-right">{player.birthYear ?? ""}</TableCell>
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
