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
import { computeSchoolRankings } from "@/lib/rankings";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  const snapshot = await getCircuitSnapshot();
  const rankings = computeSchoolRankings(snapshot);
  const rankingBySchool = new Map(rankings.map((row) => [row.schoolId, row]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Colegios</h2>
        <p className="text-sm text-muted-foreground">Nombres oficiales, alias y puntos acumulados por sus alumnos.</p>
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Base de colegios</CardTitle>
          <CardDescription>Los alias ayudan a unificar variantes que llegan desde Chess-Results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colegio oficial</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                  <TableHead className="text-right">Ranking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.schools.map((school) => {
                  const ranking = rankingBySchool.get(school.id);
                  return (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.officialName}</TableCell>
                      <TableCell>{school.city ?? ""}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {school.aliases.length ? (
                            school.aliases.map((alias) => (
                              <Badge key={alias} variant="secondary">
                                {alias}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Sin alias</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{ranking?.totalPoints ?? 0}</TableCell>
                      <TableCell className="text-right">{ranking?.rank ?? ""}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
