import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CircuitDate, SchoolRankingRow } from "@/lib/types";

interface SchoolRankingTableProps {
  rows: SchoolRankingRow[];
  dates: CircuitDate[];
}

export function SchoolRankingTable({ rows, dates }: SchoolRankingTableProps) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Todavia no hay colegios con puntos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Puesto</TableHead>
            <TableHead>Colegio</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {dates.map((date) => (
              <TableHead key={date.id} className="text-right">
                {date.name}
              </TableHead>
            ))}
            <TableHead className="text-right">1ros</TableHead>
            <TableHead className="text-right">Podios</TableHead>
            <TableHead className="text-right">Alumnos</TableHead>
            <TableHead className="text-right">Fechas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.schoolId}>
              <TableCell>
                <Badge variant={row.rank <= 3 ? "default" : "secondary"}>{row.rank}</Badge>
              </TableCell>
              <TableCell className="min-w-52 font-medium">{row.schoolName}</TableCell>
              <TableCell className="text-right font-semibold">{row.totalPoints}</TableCell>
              {dates.map((date) => (
                <TableCell key={date.id} className="text-right">
                  {row.pointsByDate[date.id] ?? 0}
                </TableCell>
              ))}
              <TableCell className="text-right">{row.firstPlaces}</TableCell>
              <TableCell className="text-right">{row.podiums}</TableCell>
              <TableCell className="text-right">{row.playersWithPoints}</TableCell>
              <TableCell className="text-right">{row.datesWithPoints}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
