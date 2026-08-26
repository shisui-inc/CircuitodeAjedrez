import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCircuitCatalog, getPublishedCircuitSnapshot } from "@/lib/server/repository";
import type { Circuit } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicCircuitsPage() {
  const catalog = (await getCircuitCatalog()).filter((circuit) => circuit.isPublished);
  const circuits = await Promise.all(
    catalog.map(async (circuit) => {
      const snapshot = await getPublishedCircuitSnapshot(circuit.id);
      return {
        ...circuit,
        tournamentCount: snapshot.dates.length,
        playerCount: new Set(snapshot.importedResults.map((result) => result.playerId)).size,
        resultCount: snapshot.importedResults.length,
      };
    }),
  );
  const active = circuits.filter((circuit) => circuit.status === "activo");
  const finished = circuits.filter((circuit) => circuit.status === "finalizado");

  return (
    <main className="min-h-dvh bg-[#f4f1e8] text-slate-950">
      <header className="border-b border-slate-900/10 bg-[#102f28] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
              <Image src="/logoflash.png" alt="Circuitos de ajedrez" width={44} height={44} className="size-10 object-contain" priority />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight">Circuitos de Ajedrez</p>
              <p className="truncate text-xs text-emerald-100">Resultados oficiales en un solo lugar</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-white/25 bg-white/10 text-white hover:bg-white hover:text-[#102f28]">
            <Link href="/login">Administrar</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#102f28] px-4 pb-14 pt-10 text-white sm:px-6 sm:pb-20 sm:pt-16">
        <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] [background-position:0_0,0_18px,18px_-18px,-18px_0] [background-size:36px_36px]" />
        <div className="relative mx-auto max-w-6xl">
          <Badge className="mb-4 bg-[#d9f65f] text-[#102f28]">Portal para jugadores y familias</Badge>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">Encontrá tu circuito. Seguí cada resultado.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-emerald-50 sm:text-lg">
            Elegí una competencia para consultar fechas, posiciones por categoría y rama, rankings y colegios desde el celular.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-emerald-50">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">{active.length} activos</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">{finished.length} finalizados</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        <CircuitGroup title="Circuitos activos" eyebrow="En competencia" circuits={active} empty="No hay circuitos activos publicados en este momento." />
        <CircuitGroup title="Circuitos terminados" eyebrow="Archivo histórico" circuits={finished} empty="Todavía no hay circuitos finalizados." />
      </div>
    </main>
  );
}

function CircuitGroup({ title, eyebrow, circuits, empty }: { title: string; eyebrow: string; circuits: Circuit[]; empty: string }) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">{eyebrow}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
        <span className="text-sm font-bold text-slate-500">{circuits.length}</span>
      </div>
      {circuits.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {circuits.map((circuit) => <CircuitCard key={circuit.id} circuit={circuit} />)}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-7 text-sm text-slate-600">{empty}</div>
      )}
    </section>
  );
}

function CircuitCard({ circuit }: { circuit: Circuit }) {
  const finished = circuit.status === "finalizado";
  return (
    <Link href={`/circuitos/${circuit.slug}`} className="group rounded-2xl border border-slate-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.11)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <Badge className={finished ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"}>
          {finished ? <CheckCircle2 className="size-3.5" /> : <Trophy className="size-3.5" />}
          {finished ? "Finalizado" : "Activo"}
        </Badge>
        <span className="text-sm font-black text-slate-400">{circuit.season}</span>
      </div>
      <h3 className="mt-5 text-2xl font-black leading-tight tracking-tight">{circuit.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{circuit.description}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{circuit.location}</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{circuit.tournamentCount ?? 0} fechas</span>
        <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{circuit.playerCount ?? 0} jugadores</span>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-emerald-800">
        Ver resultados completos <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
