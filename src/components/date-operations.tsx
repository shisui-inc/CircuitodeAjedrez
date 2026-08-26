"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CalendarPlus,
  Check,
  ChevronDown,
  CircleDot,
  Eye,
  EyeOff,
  FileCheck2,
  Pencil,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Branch, Category, Circuit, CircuitDate, ImportedResult, TournamentStatus } from "@/lib/types";

interface DateOperationsProps {
  circuit: Circuit;
  dates: CircuitDate[];
  categories: Category[];
  branches: Branch[];
  results: ImportedResult[];
}

export function DateOperations({ circuit, dates, categories, branches, results }: DateOperationsProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const summaries = useMemo(
    () => new Map(dates.map((date) => [date.id, summarizeDate(date.id, results, categories, branches)])),
    [dates, results, categories, branches],
  );
  const publishedCount = dates.filter((date) => date.status === "cerrada").length;
  const reviewCount = dates.filter((date) => date.status === "importada").length;

  async function addDate(formData: FormData) {
    setBusyId("new");
    try {
      await requestJson(`/api/circuits/${circuit.id}/tournaments`, {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      toast.success("Fecha creada. Ya puede cargar el archivo.");
      router.refresh();
    } catch (error) {
      toast.error(messageFrom(error));
    } finally {
      setBusyId(null);
    }
  }

  async function patchDate(tournamentId: string, patch: Partial<CircuitDate>, success: string) {
    setBusyId(tournamentId);
    try {
      await requestJson(`/api/circuits/${circuit.id}/tournaments/${tournamentId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(messageFrom(error));
    } finally {
      setBusyId(null);
    }
  }

  async function clearDate(tournamentId: string) {
    setBusyId(tournamentId);
    try {
      await requestJson(`/api/circuits/${circuit.id}/tournaments/${tournamentId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "BORRAR" }),
      });
      toast.success("Carga eliminada. La fecha volvió a pendiente.");
      router.refresh();
    } catch (error) {
      toast.error(messageFrom(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">Operación diaria</p>
          <h2 className="text-2xl font-semibold tracking-normal">Fechas y resultados</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cree una fecha, cargue el Excel, revise los datos y publíquela cuando esté conforme.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <SummaryValue value={dates.length} label="Fechas" />
          <SummaryValue value={reviewCount} label="En revisión" />
          <SummaryValue value={publishedCount} label="Publicadas" />
        </div>
      </div>

      {!circuit.isPublished ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <EyeOff className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>Este circuito todavía es privado.</strong> Puede preparar y publicar fechas, pero los jugadores no lo verán hasta activar la visibilidad en Circuitos.
          </p>
        </div>
      ) : null}

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarPlus className="size-5 text-emerald-700" />Agregar una fecha</CardTitle>
          <CardDescription>Solo necesita el nombre, el número de orden y el día del torneo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addDate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_8rem_12rem_auto] lg:items-end">
            <Field label="Nombre" name="name" placeholder={`Fecha ${dates.length + 1}`} required />
            <Field label="Número" name="round" type="number" min="1" defaultValue={String(dates.length + 1)} required />
            <Field label="Día" name="date" type="date" required />
            <Button type="submit" disabled={busyId === "new" || circuit.status === "finalizado"}>
              <CalendarPlus className="size-4" />{busyId === "new" ? "Creando…" : "Crear fecha"}
            </Button>
          </form>
          {circuit.status === "finalizado" ? <p className="mt-3 text-xs text-amber-700">El circuito está finalizado. Cámbielo a activo antes de agregar nuevas fechas.</p> : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="text-lg font-semibold">Calendario de trabajo</h3><p className="text-sm text-muted-foreground">Cada tarjeta muestra qué falta para completar la fecha.</p></div>
          <Badge variant="secondary">{circuit.shortName}</Badge>
        </div>

        {dates.length ? dates.map((date) => {
          const summary = summaries.get(date.id) ?? emptySummary(categories.length * branches.length);
          const busy = busyId === date.id;
          return (
            <Card key={date.id} className={date.status === "cerrada" ? "border-emerald-200" : undefined}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={date.status} />
                      <span className="text-xs font-semibold text-muted-foreground">Fecha {date.round}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(date.date)}</span>
                    </div>
                    <h4 className="mt-2 text-lg font-bold">{date.name}</h4>
                    <WorkflowSteps status={date.status} />
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button asChild variant={date.status === "pendiente" ? "default" : "outline"}>
                      <Link href={`/admin/importar?date=${encodeURIComponent(date.id)}`}>
                        {date.status === "pendiente" ? <Upload className="size-4" /> : <FileCheck2 className="size-4" />}
                        {date.status === "pendiente" ? "Cargar archivo" : "Revisar / reemplazar"}
                      </Link>
                    </Button>
                    {date.status === "cerrada" ? (
                      <Button variant="outline" disabled={busy} onClick={() => patchDate(date.id, { status: "importada" }, "Fecha retirada del portal y abierta para revisión.")}>
                        <EyeOff className="size-4" />Retirar
                      </Button>
                    ) : (
                      <PublishDialog disabled={busy || summary.results === 0} onConfirm={() => patchDate(date.id, { status: "cerrada" }, "Fecha publicada correctamente.")} />
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Metric label="Resultados guardados" value={summary.results} />
                  <Metric label="Categorías / ramas cargadas" value={`${summary.loadedScopes}/${summary.totalScopes}`} />
                  <Metric label="Filas con avisos" value={summary.needsReview} warning={summary.needsReview > 0} />
                </div>

                <details className="group mt-4 rounded-lg border bg-stone-50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
                    Ver control por categoría y herramientas
                    <ChevronDown className="size-4 transition group-open:rotate-180" />
                  </summary>
                  <div className="space-y-4 border-t p-4">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {summary.scopes.map((scope) => (
                        <div key={scope.key} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
                          <span>{scope.label}</span>
                          {scope.count ? <Badge className="bg-emerald-100 text-emerald-800">{scope.count}</Badge> : <Badge variant="secondary">Sin carga</Badge>}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 border-t pt-4">
                      <EditDateForm date={date} disabled={busy} onSave={(patch) => patchDate(date.id, patch, "Datos de la fecha actualizados.")} />
                      {summary.results > 0 ? <ClearDialog disabled={busy} onConfirm={() => clearDate(date.id)} /> : null}
                    </div>
                  </div>
                </details>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-muted-foreground">Cree la primera fecha para comenzar.</div>
        )}
      </section>
    </div>
  );
}

function summarizeDate(dateId: string, results: ImportedResult[], categories: Category[], branches: Branch[]) {
  const dateResults = results.filter((result) => result.tournamentId === dateId);
  const counts = new Map<string, number>();
  for (const result of dateResults) {
    const key = `${result.categoryId}-${result.branchId}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const scopes = categories.flatMap((category) => branches.map((branch) => ({
    key: `${category.id}-${branch.id}`,
    label: `${category.name} · ${branch.name}`,
    count: counts.get(`${category.id}-${branch.id}`) ?? 0,
  })));
  return {
    results: dateResults.length,
    needsReview: dateResults.filter((result) => result.needsReview).length,
    loadedScopes: scopes.filter((scope) => scope.count > 0).length,
    totalScopes: scopes.length,
    scopes,
  };
}

function emptySummary(totalScopes: number) {
  return { results: 0, needsReview: 0, loadedScopes: 0, totalScopes, scopes: [] as Array<{ key: string; label: string; count: number }> };
}

function WorkflowSteps({ status }: { status: TournamentStatus }) {
  const current = status === "pendiente" ? 0 : status === "importada" ? 1 : 2;
  const labels = ["Crear", "Cargar y revisar", "Publicar"];
  return <div className="mt-3 flex max-w-xl items-center gap-1" aria-label={`Progreso: ${labels[current]}`}>
    {labels.map((label, index) => <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${index <= current ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"}`}>{index < current ? <Check className="size-3" /> : index + 1}</span>
      <span className={index <= current ? "font-semibold text-slate-800" : "text-slate-400"}>{label}</span>
      {index < labels.length - 1 ? <span className={`ml-1 h-px min-w-2 flex-1 ${index < current ? "bg-emerald-500" : "bg-slate-200"}`} /> : null}
    </div>)}
  </div>;
}

function PublishDialog({ disabled, onConfirm }: { disabled: boolean; onConfirm: () => void }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button disabled={disabled}><Eye className="size-4" />Publicar fecha</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Publicar esta fecha?</AlertDialogTitle><AlertDialogDescription>Los resultados guardados pasarán a formar parte del ranking público. Puede retirarla después si necesita corregir algo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Sí, publicar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function ClearDialog({ disabled, onConfirm }: { disabled: boolean; onConfirm: () => void }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={disabled}><RotateCcw className="size-4" />Vaciar carga</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Vaciar todos los resultados?</AlertDialogTitle><AlertDialogDescription>Se eliminarán las cargas y puntos de esta fecha. La fecha seguirá existiendo y volverá a estado pendiente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onConfirm}>Vaciar resultados</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function EditDateForm({ date, disabled, onSave }: { date: CircuitDate; disabled: boolean; onSave: (patch: Partial<CircuitDate>) => void }) {
  return <details className="group w-full rounded-lg border bg-white sm:w-auto"><summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium"><Pencil className="size-4" />Editar datos</summary><form className="grid gap-3 border-t p-3 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ name: String(data.get("name")), round: Number(data.get("round")), date: String(data.get("date")) }); }}><Field label="Nombre" name="name" defaultValue={date.name} required /><Field label="Número" name="round" type="number" min="1" defaultValue={String(date.round)} required /><Field label="Día" name="date" type="date" defaultValue={date.date} required /><Button type="submit" size="sm" disabled={disabled} className="sm:col-span-3">Guardar cambios</Button></form></details>;
}

function SummaryValue({ value, label }: { value: number; label: string }) { return <div className="rounded-lg border bg-white px-3 py-2"><p className="text-lg font-bold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>; }
function Metric({ label, value, warning = false }: { label: string; value: number | string; warning?: boolean }) { return <div className={`rounded-lg px-3 py-2 ${warning ? "bg-amber-50 text-amber-900" : "bg-stone-100"}`}><p className="text-lg font-bold">{value}</p><p className="text-xs opacity-70">{label}</p></div>; }
function Field(props: React.ComponentProps<typeof Input> & { label: string }) { const { label, ...inputProps } = props; return <div className="space-y-1.5"><Label htmlFor={`${inputProps.name}-${String(inputProps.defaultValue ?? "new")}`}>{label}</Label><Input id={`${inputProps.name}-${String(inputProps.defaultValue ?? "new")}`} {...inputProps} /></div>; }
function StatusBadge({ status }: { status: TournamentStatus }) { const config = status === "cerrada" ? { label: "Publicada", className: "bg-emerald-100 text-emerald-800", icon: Eye } : status === "importada" ? { label: "En revisión", className: "bg-sky-100 text-sky-800", icon: FileCheck2 } : { label: "Pendiente", className: "bg-amber-100 text-amber-800", icon: CircleDot }; const Icon = config.icon; return <Badge className={config.className}><Icon className="size-3" />{config.label}</Badge>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-PY").format(new Date(`${value}T00:00:00`)); }
function messageFrom(error: unknown) { return error instanceof Error ? error.message : "Ocurrió un error."; }
async function requestJson<T = unknown>(url: string, init: RequestInit) { const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init.headers } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Ocurrió un error."); return payload as T; }
