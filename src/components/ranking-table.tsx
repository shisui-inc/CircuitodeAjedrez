import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CircuitDate, IndividualRankingRow } from "@/lib/types";

interface RankingTableProps {
  rows: IndividualRankingRow[];
  dates: CircuitDate[];
  emptyText?: string;
}

export function RankingTable({ rows, dates, emptyText = "Todavia no hay resultados cargados." }: RankingTableProps) {
  if (!rows.length) {
    return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{emptyText}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Puesto</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead>Colegio</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {dates.map((date) => (
              <TableHead key={date.id} className="text-right">
                {date.name}
              </TableHead>
            ))}
            <TableHead className="text-right">1ros</TableHead>
            <TableHead className="text-right">Podios</TableHead>
            <TableHead className="text-right">Fechas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.playerId}-${row.categoryId}-${row.branchId}`}>
              <TableCell>
                <Badge variant={row.rank <= 3 ? "default" : "secondary"}>{row.rank}</Badge>
              </TableCell>
              <TableCell className="min-w-44 font-medium">{row.playerName}</TableCell>
              <TableCell className="min-w-48 text-muted-foreground">{row.schoolName}</TableCell>
              <TableCell className="text-right font-semibold">{row.totalPoints}</TableCell>
              {dates.map((date) => (
                <TableCell key={date.id} className="text-right">
                  {row.pointsByDate[date.id] ?? 0}
                </TableCell>
              ))}
              <TableCell className="text-right">{row.firstPlaces}</TableCell>
              <TableCell className="text-right">{row.podiums}</TableCell>
              <TableCell className="text-right">{row.datesPlayed}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
