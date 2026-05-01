import { Filter } from "lucide-react";
import { ExportActions } from "@/components/export-actions";
import { RankingTable } from "@/components/ranking-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeIndividualRankings } from "@/lib/rankings";
import { getCircuitSnapshot } from "@/lib/server/repository";
import type { BranchId, CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    categoryId?: string;
    branchId?: string;
  }>;
}

export default async function IndividualRankingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const snapshot = await getCircuitSnapshot();
  const categoryId = parseCategory(params.categoryId);
  const branchId = parseBranch(params.branchId);
  const rows = computeIndividualRankings(snapshot, { categoryId, branchId });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Ranking Individual</h2>
          <p className="text-sm text-muted-foreground">Acumulado por categoria y rama, con desempates del reglamento.</p>
        </div>
        <ExportActions scope="individual" categoryId={categoryId} branchId={branchId} />
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Use General para ver el acumulado completo del circuito.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select name="categoryId" defaultValue={categoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  {snapshot.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rama</Label>
              <Select name="branchId" defaultValue={branchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  {snapshot.branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full md:w-auto">
                <Filter className="size-4" />
                Aplicar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <RankingTable rows={rows} dates={snapshot.dates} />
    </div>
  );
}

function parseCategory(value?: string): CategoryId | "general" {
  const allowed = ["sub-6", "sub-8", "sub-10", "sub-12", "sub-14", "abierto", "general"];
  return allowed.includes(value ?? "") ? (value as CategoryId | "general") : "general";
}

function parseBranch(value?: string): BranchId | "general" {
  const allowed = ["absoluto", "femenino", "general"];
  return allowed.includes(value ?? "") ? (value as BranchId | "general") : "general";
}
