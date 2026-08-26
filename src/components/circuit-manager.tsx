"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CalendarDays, Check, Download, Eye, EyeOff, Plus, Radio, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Circuit, CircuitDate, CircuitStatus } from "@/lib/types";

export function CircuitManager({ circuits, selectedCircuit, dates }: { circuits: Circuit[]; selectedCircuit: Circuit; dates: CircuitDate[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function selectCircuit(circuitId: string) {
    setBusy(true);
    try {
      await requestJson("/api/admin/circuit-selection", { method: "POST", body: JSON.stringify({ circuitId }) });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo seleccionar.");
    } finally { setBusy(false); }
  }

  async function updateSelected(patch: Partial<Circuit>, success: string) {
    setBusy(true);
    try {
      await requestJson(`/api/circuits/${selectedCircuit.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar.");
    } finally { setBusy(false); }
  }

  async function createCircuitAction(formData: FormData) {
    setBusy(true);
    try {
      const payload = Object.fromEntries(formData.entries());
      const response = await requestJson<{ circuit: Circuit }>("/api/circuits", { method: "POST", body: JSON.stringify(payload) });
      await requestJson("/api/admin/circuit-selection", { method: "POST", body: JSON.stringify({ circuitId: response.circuit.id }) });
      toast.success("Circuito creado como borrador.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear.");
    } finally { setBusy(false); }
  }

  async function editCircuitAction(formData: FormData) {
    await updateSelected(
      {
        name: String(formData.get("name") ?? ""),
        shortName: String(formData.get("shortName") ?? ""),
        season: String(formData.get("season") ?? ""),
        location: String(formData.get("location") ?? ""),
        description: String(formData.get("description") ?? ""),
        startsAt: String(formData.get("startsAt") ?? "") || undefined,
        endsAt: String(formData.get("endsAt") ?? "") || undefined,
      },
      "Información del circuito actualizada.",
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-emerald-700">Centro de control</p>
        <h2 className="text-2xl font-semibold tracking-normal">Circuitos y publicación</h2>
        <p className="text-sm text-muted-foreground">Cree competencias, cambie el circuito de trabajo, publique resultados y archive temporadas completas.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Todos los circuitos</CardTitle><CardDescription>Puede administrar varias temporadas sin mezclar fechas ni resultados.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {circuits.map((circuit) => (
              <button key={circuit.id} type="button" disabled={busy} onClick={() => selectCircuit(circuit.id)} className={`rounded-xl border p-4 text-left transition ${circuit.id === selectedCircuit.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "bg-white hover:border-slate-300"}`}>
                <div className="flex items-center justify-between gap-3"><StatusBadge status={circuit.status} /><span className="text-xs font-bold text-slate-500">{circuit.season}</span></div>
                <p className="mt-3 font-bold leading-tight">{circuit.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{circuit.location || "Sin ubicación"}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">{circuit.isPublished ? <><Eye className="size-3.5" /> Público</> : <><EyeOff className="size-3.5" /> Privado</>}{circuit.id === selectedCircuit.id ? <span className="ml-auto inline-flex items-center gap-1 text-emerald-700"><Check className="size-3.5" /> Seleccionado</span> : null}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Plus className="size-5" /></div><CardTitle>Nuevo circuito</CardTitle><CardDescription>Se crea privado y en borrador; publíquelo cuando esté listo.</CardDescription></CardHeader>
          <CardContent><form action={createCircuitAction} className="space-y-3">
            <Field label="Nombre completo" name="name" placeholder="Circuito Escolar del Este" required />
            <div className="grid grid-cols-2 gap-3"><Field label="Nombre corto" name="shortName" placeholder="Este 2027" /><Field label="Temporada" name="season" placeholder="2027" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Categorías" name="categoryScheme" defaultValue="pares" options={[{ value: "pares", label: "Pares: Sub 6 a Sub 14" }, { value: "impares", label: "Impares: Sub 7 a Sub 13" }]} />
              <SelectField label="Modalidad" name="modality" defaultValue="presencial" options={[{ value: "presencial", label: "Presencial" }, { value: "online", label: "Online / Lichess" }, { value: "hibrido", label: "Híbrido" }]} />
            </div>
            <Field label="Ubicación" name="location" placeholder="Alto Paraná, Paraguay" />
            <div className="grid grid-cols-2 gap-3"><Field label="Inicio" name="startsAt" type="date" /><Field label="Final" name="endsAt" type="date" /></div>
            <div className="space-y-1.5"><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" placeholder="Información que verán jugadores y familias." /></div>
            <Button type="submit" disabled={busy} className="w-full"><Plus className="size-4" />Crear circuito</Button>
          </form></CardContent>
        </Card>
      </div>

      <Card className="border-emerald-200">
        <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{selectedCircuit.name}</CardTitle><CardDescription>Circuito seleccionado para todas las herramientas del panel.</CardDescription></div><StatusBadge status={selectedCircuit.status} /></div></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <LifecycleButton icon={Settings2} label="Borrador" active={selectedCircuit.status === "borrador"} disabled={busy} onClick={() => updateSelected({ status: "borrador" }, "Circuito movido a borrador.")} />
            <LifecycleButton icon={Radio} label="Activo" active={selectedCircuit.status === "activo"} disabled={busy} onClick={() => updateSelected({ status: "activo" }, "Circuito marcado como activo.")} />
            <LifecycleButton icon={Archive} label="Finalizado" active={selectedCircuit.status === "finalizado"} disabled={busy} onClick={() => updateSelected({ status: "finalizado" }, "Circuito archivado como finalizado.")} />
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-bold">Visibilidad pública</p><p className="text-sm text-muted-foreground">{selectedCircuit.isPublished ? "Los jugadores pueden consultar este circuito." : "Solo aparece dentro del panel administrativo."}</p></div>
            <Button variant={selectedCircuit.isPublished ? "outline" : "default"} disabled={busy} onClick={() => updateSelected({ isPublished: !selectedCircuit.isPublished }, selectedCircuit.isPublished ? "Circuito retirado del portal público." : "Circuito publicado.")}>{selectedCircuit.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{selectedCircuit.isPublished ? "Ocultar" : "Publicar"}</Button>
          </div>
          <details className="rounded-xl border bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold">Editar información del circuito</summary>
            <form action={editCircuitAction} className="grid gap-3 border-t p-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Nombre completo" name="name" defaultValue={selectedCircuit.name} required /></div>
              <Field label="Nombre corto" name="shortName" defaultValue={selectedCircuit.shortName} required />
              <Field label="Temporada" name="season" defaultValue={selectedCircuit.season} required />
              <div className="sm:col-span-2"><Field label="Ubicación" name="location" defaultValue={selectedCircuit.location} /></div>
              <Field label="Inicio" name="startsAt" type="date" defaultValue={selectedCircuit.startsAt} />
              <Field label="Final" name="endsAt" type="date" defaultValue={selectedCircuit.endsAt} />
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="edit-description">Descripción</Label><Textarea id="edit-description" name="description" defaultValue={selectedCircuit.description} /></div>
              <Button type="submit" disabled={busy} className="sm:col-span-2">Guardar información</Button>
            </form>
          </details>
          <Button asChild variant="outline"><a href={`/api/export?scope=full&report=archive&format=xlsx&circuitId=${selectedCircuit.id}`}><Download className="size-4" />Descargar Excel completo</a></Button>
        </CardContent>
      </Card>

      <Card className="bg-sky-50/60">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><CalendarDays className="size-5" /></div><div><p className="font-bold">{dates.length} fechas en {selectedCircuit.shortName}</p><p className="text-sm text-muted-foreground">La creación, carga, revisión y publicación se realiza desde una sola pantalla.</p></div></div>
          <Button asChild><Link href="/admin/fechas"><CalendarDays className="size-4" />Administrar fechas</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string }) { const { label, ...inputProps } = props; return <div className="space-y-1.5"><Label htmlFor={inputProps.name}>{label}</Label><Input id={inputProps.name} {...inputProps} /></div>; }
function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: Array<{ value: string; label: string }> }) { return <div className="space-y-1.5"><Label htmlFor={name}>{label}</Label><select id={name} name={name} defaultValue={defaultValue} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>; }
function StatusBadge({ status }: { status: CircuitStatus }) { return <Badge className={status === "activo" ? "bg-emerald-100 text-emerald-800" : status === "finalizado" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"}>{status}</Badge>; }
function LifecycleButton({ icon: Icon, label, active, ...props }: { icon: typeof Archive; label: string; active: boolean } & React.ComponentProps<typeof Button>) { return <Button type="button" variant={active ? "default" : "outline"} className="justify-start" {...props}><Icon className="size-4" />{label}{active ? <Check className="ml-auto size-4" /> : null}</Button>; }
async function requestJson<T = unknown>(url: string, init: RequestInit) { const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init.headers } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Ocurrió un error."); return payload as T; }
