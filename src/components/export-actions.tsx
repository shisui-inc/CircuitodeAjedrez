import { FileDown, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportActionsProps {
  scope: "individual" | "colegios";
  report?: "ranking" | "por-fecha" | "acumulado-categorias" | "cupo-sudamericano-acumulado";
  categoryId?: string;
  branchId?: string;
}

export function ExportActions({
  scope,
  report = "ranking",
  categoryId = "general",
  branchId = "general",
}: ExportActionsProps) {
  const query = new URLSearchParams({ scope, report, categoryId, branchId });

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <a href={`/api/export?${query.toString()}&format=csv`}>
          <FileDown className="size-4" />
          CSV
        </a>
      </Button>
      <Button asChild>
        <a href={`/api/export?${query.toString()}&format=xlsx`}>
          <Table2 className="size-4" />
          XLSX
        </a>
      </Button>
    </div>
  );
}
