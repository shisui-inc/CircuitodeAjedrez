"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Branch, Category, CircuitDate, ImportedResult } from "@/lib/types";

interface CorrectionsPanelProps {
  dates: CircuitDate[];
  categories: Category[];
  branches: Branch[];
  results: ImportedResult[];
}

type EditableResult = Pick<
  ImportedResult,
  "id" | "tournamentId" | "categoryId" | "branchId" | "place" | "playerName" | "schoolName" | "tournamentPoints" | "tieBreaks"
>;

export function CorrectionsPanel({ dates, categories, branches, results }: CorrectionsPanelProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(dates[0]?.id ?? "all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [rows, setRows] = useState<EditableResult[]>(
    results.map((result) => ({
      id: result.id,
      tournamentId: result.tournamentId,
      categoryId: result.categoryId,
      branchId: result.branchId,
      place: result.place,
      playerName: result.playerName,
      schoolName: result.schoolName,
      tournamentPoints: result.tournamentPoints,
      tieBreaks: result.tieBreaks,
    })),
  );
  const [savingId, setSavingId] = useState("");
  const [status, setStatus] = useState("");

  const dateById = useMemo(() => new Map(dates.map((date) => [date.id, date])), [dates]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const visibleRows = rows
    .filter((row) => selectedDate === "all" || row.tournamentId === selectedDate)
    .filter((row) => selectedCategory === "all" || row.categoryId === selectedCategory)
    .filter((row) => selectedBranch === "all" || row.branchId === selectedBranch)
    .sort((a, b) => (a.place ?? 9999) - (b.place ?? 9999));

  function updateRow(id: string, patch: Partial<EditableResult>) {
    setRows((currentRows) => currentRows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveRow(row: EditableResult) {
    setSavingId(row.id);
    setStatus("");

    try {
      const response = await fetch("/api/correcciones", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(row),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar la correccion.");
      }

      setStatus(payload.message ?? "Correccion guardada.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo guardar la correccion.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Correccion de resultados cargados</CardTitle>
        <CardDescription>
          Edite puestos, nombres, colegios, puntos de torneo y desempates de una carga ya confirmada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {dates.map((date) => (
                  <SelectItem key={date.id} value={date.id}>
                    {date.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rama</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {status ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{status}</p> : null}

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>Contexto</TableHead>
                  <TableHead className="w-36">Rama</TableHead>
                  <TableHead className="w-24">Puesto</TableHead>
                <TableHead className="min-w-56">Jugador</TableHead>
                <TableHead className="min-w-56">Colegio</TableHead>
                <TableHead className="w-28">Puntos</TableHead>
                <TableHead className="min-w-56">Desempates</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{dateById.get(row.tournamentId)?.name ?? row.tournamentId}</span>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">{categoryById.get(row.categoryId)?.name ?? row.categoryId}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={row.branchId} onValueChange={(value) => updateRow(row.id, { branchId: value as EditableResult["branchId"] })}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      inputMode="numeric"
                      value={row.place ?? ""}
                      onChange={(event) =>
                        updateRow(row.id, { place: event.target.value ? Number(event.target.value) : null })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input value={row.playerName} onChange={(event) => updateRow(row.id, { playerName: event.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={row.schoolName} onChange={(event) => updateRow(row.id, { schoolName: event.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      inputMode="decimal"
                      value={row.tournamentPoints}
                      onChange={(event) =>
                        updateRow(row.id, { tournamentPoints: Number(event.target.value.replace(",", ".")) || 0 })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      className="min-h-10"
                      value={tieBreaksToText(row.tieBreaks)}
                      onChange={(event) => updateRow(row.id, { tieBreaks: textToTieBreaks(event.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" onClick={() => saveRow(row)} disabled={savingId === row.id}>
                      <Save className="size-4" />
                      Guardar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!visibleRows.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Todavia no hay resultados cargados para corregir.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function tieBreaksToText(tieBreaks: Record<string, number | string>) {
  return Object.entries(tieBreaks)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function textToTieBreaks(value: string) {
  return Object.fromEntries(
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part, index) => {
        const [key, ...rest] = part.split(":");
        return [key?.trim() || `Desempate ${index + 1}`, rest.join(":").trim()];
      }),
  );
}
