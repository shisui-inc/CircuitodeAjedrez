"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Plus, Trash2, Upload } from "lucide-react";
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
import { validateImportRows } from "@/lib/normalize";
import type { Branch, BranchId, Category, CategoryId, CircuitDate, ImportRow } from "@/lib/types";

interface ImportWizardProps {
  dates: CircuitDate[];
  categories: Category[];
  branches: Branch[];
  initialRows: ImportRow[];
}

export function ImportWizard({ dates, categories, branches, initialRows }: ImportWizardProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [tournamentId, setTournamentId] = useState(dates[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<CategoryId>(categories[0]?.id ?? "sub-6");
  const [branchId, setBranchId] = useState<BranchId>(branches[0]?.id ?? "absoluto");
  const [mixedMode, setMixedMode] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>(initialRows);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const issues = useMemo(() => validateImportRows(rows), [rows]);
  const branchPendingCount = rows.filter((row) => row.branchId !== "absoluto" && row.branchId !== "femenino").length;
  const blockingIssues = issues.filter((issue) => issue.severity === "error");
  const branchPreview = useMemo(() => buildBranchPreview(rows), [rows]);

  async function parseSource() {
    setIsParsing(true);
    setStatus("");

    try {
      const response = await fetch("/api/import/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceUrl }),
      });
      const payload = (await response.json()) as { rows?: ImportRow[]; warnings?: string[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo importar la tabla.");
      }

      setRows(payload.rows ?? []);
      setWarnings(payload.warnings ?? []);
      setStatus("Clasificacion leida. Revise la tabla antes de confirmar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo importar la tabla.");
    } finally {
      setIsParsing(false);
    }
  }

  async function parseFile() {
    if (!selectedFile) {
      setStatus("Seleccione un archivo .xlsx.");
      return;
    }

    setIsParsing(true);
    setStatus("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/import/parse-file", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { rows?: ImportRow[]; warnings?: string[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo leer el archivo.");
      }

      setRows(payload.rows ?? []);
      setWarnings(payload.warnings ?? []);
      setSourceUrl(selectedFile.name);
      setMixedMode(true);
      setStatus("Archivo leido. Revise la rama de cada jugador antes de confirmar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    } finally {
      setIsParsing(false);
    }
  }

  async function confirmRows() {
    setIsConfirming(true);
    setStatus("");

    try {
      const response = await fetch(mixedMode ? "/api/import/confirm-mixed" : "/api/import/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mixedMode ? { sourceUrl, tournamentId, categoryId, rows } : { sourceUrl, tournamentId, categoryId, branchId, rows }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo confirmar la carga.");
      }

      setStatus(payload.message ?? "Carga confirmada.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo confirmar la carga.");
    } finally {
      setIsConfirming(false);
    }
  }

  function updateRow(tempId: string, patch: Partial<ImportRow>) {
    setRows((currentRows) => currentRows.map((row) => (row.tempId === tempId ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      {
        tempId: `manual-${crypto.randomUUID?.() ?? Date.now()}`,
          place: currentRows.length + 1,
          playerName: "",
          schoolName: "",
          branchId: mixedMode ? "pendiente" : branchId,
          tournamentPoints: 0,
        tieBreaks: {},
        raw: {},
        detected: { place: true, player: false, school: false },
        warnings: [],
      },
    ]);
  }

  function deleteRow(tempId: string) {
    setRows((currentRows) => currentRows.filter((row) => row.tempId !== tempId));
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Importar desde Chess-Results</CardTitle>
          <CardDescription>Seleccione el contexto de la fecha y pegue el link publico de la clasificacion final.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
          <div className="space-y-2 lg:col-span-5">
            <Label htmlFor="file">Archivo Excel de Chess-Results / Swiss-Manager</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="file"
                type="file"
                accept=".xlsx"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <Button variant="outline" onClick={parseFile} disabled={isParsing || !selectedFile}>
                <FileSpreadsheet className="size-4" />
                Leer Excel
              </Button>
            </div>
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="sourceUrl">Link publico</Label>
            <Input id="sourceUrl" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
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
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value as CategoryId)}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
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
            <Select value={branchId} onValueChange={(value) => setBranchId(value as BranchId)}>
              <SelectTrigger>
                <SelectValue placeholder="Rama" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant={mixedMode ? "default" : "outline"}
              className="w-full"
              onClick={() => setMixedMode((value) => !value)}
            >
              {mixedMode ? "Mixto ON" : "Mixto OFF"}
            </Button>
          </div>
          <div className="flex items-end">
            <Button className="w-full lg:w-auto" onClick={parseSource} disabled={isParsing}>
              <Upload className="size-4" />
              {isParsing ? "Leyendo" : "Leer tabla"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Revision de importacion</CardTitle>
            <CardDescription>Corrija puestos, colegios, jugadores y desempates antes de guardar.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={addRow}>
              <Plus className="size-4" />
              Agregar fila
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <IssueList warnings={warnings} issues={issues} />
          {mixedMode ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <PreviewPanel title="Top 10 absoluto" rows={branchPreview.absoluto} />
              <PreviewPanel title="Top 10 femenino" rows={branchPreview.femenino} />
              <div className="rounded-lg border bg-white p-4">
                <p className="text-sm font-semibold">Control de ramas</p>
                <p className="mt-2 text-3xl font-semibold">{branchPendingCount}</p>
                <p className="text-sm text-muted-foreground">jugadores pendientes de rama</p>
              </div>
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Puesto general</TableHead>
                  <TableHead className="w-36">Rama</TableHead>
                  <TableHead className="min-w-56">Jugador</TableHead>
                  <TableHead className="min-w-56">Colegio</TableHead>
                  <TableHead className="w-28">Puntos</TableHead>
                  <TableHead className="min-w-52">Desempates</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.tempId}>
                    <TableCell>
                      <Input
                        className="w-20"
                        inputMode="numeric"
                        value={row.place ?? ""}
                        onChange={(event) =>
                          updateRow(row.tempId, { place: event.target.value ? Number(event.target.value) : null })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.branchId ?? "pendiente"}
                        onValueChange={(value) =>
                          updateRow(row.tempId, { branchId: value as ImportRow["branchId"] })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="absoluto">Absoluto</SelectItem>
                          <SelectItem value="femenino">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.playerName}
                        onChange={(event) => updateRow(row.tempId, { playerName: event.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.schoolName}
                        placeholder="Crear colegio automaticamente"
                        onChange={(event) => updateRow(row.tempId, { schoolName: event.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-24"
                        inputMode="decimal"
                        value={row.tournamentPoints}
                        onChange={(event) =>
                          updateRow(row.tempId, { tournamentPoints: Number(event.target.value.replace(",", ".")) || 0 })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        className="min-h-10"
                        value={tieBreaksToText(row.tieBreaks)}
                        onChange={(event) => updateRow(row.tempId, { tieBreaks: textToTieBreaks(event.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="Eliminar fila" onClick={() => deleteRow(row.tempId)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 rounded-lg bg-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{rows.length} filas listas para revisar</p>
              <p className="text-sm text-muted-foreground">
                {mixedMode
                  ? "El puesto general se conserva como fuente; al confirmar se recalcula el puesto por rama y solo el top 10 de cada rama suma."
                  : "Solo los puestos 1 al 10 suman puntos; los colegios nuevos se crean al confirmar."}
              </p>
            </div>
            <Button
              onClick={confirmRows}
              disabled={
                isConfirming ||
                blockingIssues.length > 0 ||
                rows.length === 0 ||
                (mixedMode && branchPendingCount > 0)
              }
            >
              <CheckCircle2 className="size-4" />
              Confirmar carga
            </Button>
          </div>
          {status ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{status}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function buildBranchPreview(rows: ImportRow[]) {
  const sortRows = (branchId: BranchId) =>
    rows
      .filter((row) => row.branchId === branchId)
      .sort((a, b) => (a.place ?? 9999) - (b.place ?? 9999))
      .slice(0, 10)
      .map((row, index) => ({ ...row, branchPlace: index + 1 }));

  return {
    absoluto: sortRows("absoluto"),
    femenino: sortRows("femenino"),
  };
}

function PreviewPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<ImportRow & { branchPlace: number }>;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.length ? (
          rows.map((row) => (
            <div key={`${title}-${row.tempId}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                {row.branchPlace}. {row.playerName}
              </span>
              <Badge variant="secondary">Gral. {row.place ?? "-"}</Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Sin jugadores asignados.</p>
        )}
      </div>
    </div>
  );
}

function IssueList({
  warnings,
  issues,
}: {
  warnings: string[];
  issues: ReturnType<typeof validateImportRows>;
}) {
  const visible = [...warnings.map((message) => ({ message, severity: "warning" as const })), ...issues];

  if (!visible.length) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        <CheckCircle2 className="size-4" />
        No se detectan errores de revision.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((issue, index) => (
        <div key={`${issue.message}-${index}`} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{issue.message}</span>
          <Badge variant={issue.severity === "error" ? "destructive" : "secondary"}>
            {issue.severity === "error" ? "Error" : "Aviso"}
          </Badge>
        </div>
      ))}
    </div>
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
