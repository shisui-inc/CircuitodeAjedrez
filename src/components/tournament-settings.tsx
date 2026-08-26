"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCheck, CheckCircle2, CircleDashed, ExternalLink, LockKeyhole, Settings2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryScheme, Circuit, TournamentModality } from "@/lib/types";

export function TournamentSettings({ circuit, categories, resultCount }: { circuit: Circuit; categories: string[]; resultCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const schemeLocked = resultCount > 0;

  async function saveSettings(formData: FormData) {
    setBusy(true);
    try {
      const payload = {
        categoryScheme: String(formData.get("categoryScheme")) as CategoryScheme,
        modality: String(formData.get("modality")) as TournamentModality,
        logoUrl: cleanText(formData.get("logoUrl")),
        instagramUrl: cleanText(formData.get("instagramUrl")),
        facebookUrl: cleanText(formData.get("facebookUrl")),
      };
      const response = await fetch(`/api/circuits/${circuit.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No se pudieron guardar los ajustes.");
      toast.success("Ajustes del torneo guardados.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron guardar los ajustes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-emerald-700">Configuración deportiva</p>
        <h2 className="text-2xl font-semibold tracking-normal">Ajustes del torneo</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Configure las categorías, modalidad y enlaces oficiales del circuito seleccionado.</p>
      </div>

      <Card className="border-emerald-200">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Settings2 className="size-5" /></div>
          <CardTitle>{circuit.name}</CardTitle>
          <CardDescription>Estos ajustes controlan las categorías disponibles al crear y cargar cada fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSettings} className="space-y-6">
            <section className="space-y-3">
              <div><Label className="text-base font-bold">Esquema de categorías</Label><p className="text-sm text-muted-foreground">Elija el esquema antes de cargar resultados.</p></div>
              {schemeLocked ? <input type="hidden" name="categoryScheme" value={circuit.categoryScheme} /> : null}
              <div className="grid gap-3 md:grid-cols-2">
                <SchemeOption name="categoryScheme" value="pares" title="Torneo Par" categories="Sub 6 · Sub 8 · Sub 10 · Sub 12 · Sub 14 · Abierto" defaultChecked={circuit.categoryScheme === "pares"} disabled={schemeLocked} />
                <SchemeOption name="categoryScheme" value="impares" title="Torneo Impar" categories="Sub 7 · Sub 9 · Sub 11 · Sub 13 · Abierto" defaultChecked={circuit.categoryScheme === "impares"} disabled={schemeLocked} />
              </div>
              {schemeLocked ? <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><span>El esquema está bloqueado porque existen {resultCount} resultados. Esto evita mezclar categorías históricas. Para cambiarlo, cree otro circuito o vacíe primero las cargas.</span></div> : null}
              <div className="rounded-lg bg-stone-100 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Categorías activas</p><div className="mt-2 flex flex-wrap gap-2">{categories.map((category) => <Badge key={category} variant="secondary">{category}</Badge>)}</div></div>
            </section>

            <section className="grid gap-4 border-t pt-5 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="modality">Modalidad principal</Label><select id="modality" name="modality" defaultValue={circuit.modality} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"><option value="presencial">Presencial · Chess-Results / Swiss-Manager</option><option value="online">Online · Lichess</option><option value="hibrido">Híbrido · según cada fecha</option></select></div>
              <div className="space-y-2"><Label htmlFor="logoUrl">URL del logo oficial</Label><Input id="logoUrl" name="logoUrl" type="url" defaultValue={circuit.logoUrl} placeholder="https://.../logo.png" /></div>
              <div className="space-y-2"><Label htmlFor="instagramUrl">Instagram</Label><Input id="instagramUrl" name="instagramUrl" type="url" defaultValue={circuit.instagramUrl} placeholder="https://instagram.com/..." /></div>
              <div className="space-y-2"><Label htmlFor="facebookUrl">Facebook</Label><Input id="facebookUrl" name="facebookUrl" type="url" defaultValue={circuit.facebookUrl} placeholder="https://facebook.com/..." /></div>
            </section>

            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild variant="outline"><Link href="/admin/configuracion-puntos">Configurar escala de puntos <ExternalLink className="size-4" /></Link></Button>
              <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar ajustes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700"><BookCheck className="size-5" /></div><CardTitle>Compatibilidad con la guía operativa</CardTitle><CardDescription>Estado real de las capacidades descritas para el Campeonato Paraguayo Escolar y Abierto.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <Capability title="Disponible" tone="ready" items={["Circuitos y fechas independientes", "Esquemas Par e Impar", "Ramas Absoluto y Femenino", "Top 10 con escala 12 a 3", "Ranking individual e institucional", "Revisión privada antes de publicar", "Carga XLSX de Chess-Results", "Auditoría y exportación Excel"]} />
          <Capability title="Disponible parcialmente" tone="partial" items={["Correcciones sin historial completo de versiones", "Datos de fecha sin hora, sede ni inscripción pública", "Informes sin nick, nacimiento ni categoría de origen", "Perfiles deportivos todavía básicos"]} />
          <Capability title="Próxima implementación" tone="planned" items={["Excel de inscripciones + CSV final de Lichess", "Cruce exacto y excepciones por nick", "Validación de categoría de origen", "Campos privados de contacto y nacimiento", "Certificados automáticos del top 3"]} />
        </CardContent>
      </Card>
    </div>
  );
}

function SchemeOption({ name, value, title, categories, defaultChecked, disabled }: { name: string; value: CategoryScheme; title: string; categories: string; defaultChecked: boolean; disabled: boolean }) {
  return <label className={`relative flex cursor-pointer gap-3 rounded-xl border p-4 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:ring-2 has-[:checked]:ring-emerald-100 ${disabled ? "cursor-not-allowed opacity-70" : ""}`}><input className="mt-1 size-4 accent-emerald-700" type="radio" name={name} value={value} defaultChecked={defaultChecked} disabled={disabled} /><span><span className="block font-bold">{title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{categories}</span></span></label>;
}

function Capability({ title, tone, items }: { title: string; tone: "ready" | "partial" | "planned"; items: string[] }) {
  const Icon = tone === "ready" ? CheckCircle2 : tone === "partial" ? TriangleAlert : CircleDashed;
  const color = tone === "ready" ? "text-emerald-700" : tone === "partial" ? "text-amber-700" : "text-sky-700";
  return <section className="rounded-xl border p-4"><h3 className={`flex items-center gap-2 font-bold ${color}`}><Icon className="size-4" />{title}</h3><ul className="mt-3 space-y-2 text-sm text-slate-600">{items.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul></section>;
}

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
