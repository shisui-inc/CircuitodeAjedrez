"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronRight, CircleDot, MapPin, Search, ShieldCheck, Sparkles, Trophy, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Circuit } from "@/lib/types";

type PublicCircuit = Circuit & { tournamentCount: number; playerCount: number; resultCount: number };
type CircuitFilter = "todos" | "activos" | "finalizados";

export function PublicCircuitsHome({ circuits }: { circuits: PublicCircuit[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CircuitFilter>("todos");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const activeCount = circuits.filter((circuit) => circuit.status === "activo").length;
  const resultCount = circuits.reduce((total, circuit) => total + circuit.resultCount, 0);
  const playerCount = circuits.reduce((total, circuit) => total + circuit.playerCount, 0);
  const visibleCircuits = useMemo(() => circuits.filter((circuit) => {
    const matchesFilter = filter === "todos"
      || (filter === "activos" && circuit.status === "activo")
      || (filter === "finalizados" && circuit.status === "finalizado");
    const searchable = `${circuit.name} ${circuit.shortName} ${circuit.location} ${circuit.season}`.toLocaleLowerCase("es");
    return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
  }), [circuits, filter, normalizedQuery]);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#f4f0e5] text-[#14231f]">
      <header className="absolute inset-x-0 top-0 z-30 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/rankings" className="flex min-w-0 items-center gap-2.5" aria-label="Inicio de Circuitos de Ajedrez">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 p-1.5 backdrop-blur">
              <Image src="/logoflash.png" alt="" width={40} height={40} className="size-full object-contain" priority />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black tracking-tight">Circuitos de Ajedrez</strong>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/75">Paraguay juega</span>
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="rounded-full border border-white/15 bg-white/5 px-3 text-xs font-bold text-white backdrop-blur hover:bg-white hover:text-[#12352d] sm:px-4 sm:text-sm">
            <Link href="/login">Administrar</Link>
          </Button>
        </div>
      </header>

      <section className="relative isolate bg-[#10392f] px-4 pb-28 pt-28 text-white sm:px-6 sm:pb-32 sm:pt-36 lg:px-8">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_22%,rgba(216,245,95,0.18),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(52,211,153,0.16),transparent_34%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.055] [background-image:linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] [background-position:0_0,0_24px,24px_-24px,-24px_0] [background-size:48px_48px]" />
        <div className="absolute -right-16 top-24 -z-10 select-none text-[17rem] leading-none text-white/[0.035] sm:right-4 sm:text-[24rem]" aria-hidden="true">♞</div>

        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9f55f]/30 bg-[#d9f55f]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#e9ff91]">
              <Sparkles className="size-3.5" /> Resultados oficiales, siempre cerca
            </div>
            <h1 className="mt-6 text-[2.7rem] font-black leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Tu torneo.<br /><span className="text-[#d9f55f]">Tu partida.</span><br />Tu historia.
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-emerald-50/80 sm:text-lg">
              Entrá, elegí tu circuito y encontrá posiciones, puntos y resultados por categoría. Todo claro, rápido y pensado para el celular.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
              <Button asChild size="lg" className="h-13 rounded-2xl bg-[#d9f55f] px-6 text-sm font-black text-[#12352d] shadow-[0_12px_34px_rgba(217,245,95,0.18)] hover:bg-[#e5ff79]">
                <a href="#torneos">Ver torneos <ArrowRight className="size-4" /></a>
              </Button>
              <div className="flex items-center gap-2 px-1 text-xs font-bold text-emerald-100/70 min-[430px]:px-3">
                <ShieldCheck className="size-4 text-[#d9f55f]" /> Datos revisados antes de publicar
              </div>
            </div>
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-sm lg:block" aria-hidden="true">
            <div className="absolute inset-4 rotate-6 rounded-[3rem] border border-white/10 bg-white/[0.055]" />
            <div className="absolute inset-10 -rotate-3 rounded-[2.5rem] border border-[#d9f55f]/20 bg-[#0d2e27] shadow-2xl" />
            <div className="absolute inset-0 flex items-center justify-center text-[13rem] leading-none text-[#d9f55f] drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]">♞</div>
            <span className="absolute right-2 top-10 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black backdrop-blur">JAQUE ♟</span>
            <span className="absolute bottom-12 left-0 rounded-full bg-[#d9f55f] px-4 py-2 text-xs font-black text-[#12352d] shadow-xl">TU MEJOR JUGADA</span>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Resumen del portal">
        <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_20px_60px_rgba(17,51,43,0.12)]">
          <HeroMetric value={activeCount} label="Activos" icon={CircleDot} />
          <HeroMetric value={playerCount} label="Jugadores" icon={Users} />
          <HeroMetric value={resultCount} label="Resultados" icon={Trophy} />
        </div>
      </section>

      <section id="torneos" className="scroll-mt-4 px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#23705d]">Elegí dónde estás jugando</p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">Todos los circuitos.<br /><span className="text-[#6f7d77]">Un solo lugar.</span></h2>
          </div>

          <div className="mt-7 rounded-3xl border border-[#173b32]/10 bg-[#ece6d8] p-2 sm:mt-10 sm:flex sm:items-center sm:gap-3 sm:p-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#61706a]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar torneo, ciudad o año" aria-label="Buscar torneo, ciudad o temporada" className="h-13 rounded-2xl border-0 bg-white pl-12 pr-11 text-base shadow-none placeholder:text-[#7c8984] focus-visible:ring-[#287561]/30" />
              {query ? <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#61706a] hover:bg-[#edf1ee]"><X className="size-4" /></button> : null}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1 sm:mt-0 sm:flex">
              <FilterButton active={filter === "todos"} onClick={() => setFilter("todos")}>Todos</FilterButton>
              <FilterButton active={filter === "activos"} onClick={() => setFilter("activos")}>Activos</FilterButton>
              <FilterButton active={filter === "finalizados"} onClick={() => setFilter("finalizados")}>Archivo</FilterButton>
            </div>
          </div>

          {visibleCircuits.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
              {visibleCircuits.map((circuit, index) => <CircuitCard key={circuit.id} circuit={circuit} featured={index === 0 && circuit.status === "activo"} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-[#173b32]/20 bg-white/50 px-6 py-12 text-center">
              <span className="text-5xl" aria-hidden="true">♟</span><h3 className="mt-4 text-lg font-black">No encontramos ese circuito</h3>
              <p className="mt-1 text-sm text-[#63716b]">Probá con otra ciudad, temporada o quitá los filtros.</p>
              <Button type="button" variant="outline" className="mt-5 rounded-full" onClick={() => { setQuery(""); setFilter("todos"); }}>Ver todos</Button>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-[#173b32]/10 bg-[#e8e1d2] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#23705d]">Llegá a tu resultado</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Tres movimientos.<br />Así de simple.</h2></div>
          <ol className="grid gap-3 sm:grid-cols-3">
            <Step number="01" title="Elegí" text="Abrí el circuito en el que participás." />
            <Step number="02" title="Buscá" text="Escribí tu nombre o el de tu colegio." />
            <Step number="03" title="Seguí" text="Revisá puntos, puestos y cada fecha." />
          </ol>
        </div>
      </section>

      <footer className="bg-[#0d2e27] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-white p-1.5"><Image src="/logoflash.png" alt="" width={44} height={44} className="size-full object-contain" /></span><div><p className="font-black">Circuitos de Ajedrez</p><p className="text-xs text-emerald-100/60">Cada partida cuenta.</p></div></div>
          <p className="max-w-sm text-xs leading-relaxed text-emerald-100/55">Portal público de resultados y rankings. La información se publica después de la revisión de cada organización.</p>
        </div>
      </footer>
    </main>
  );
}

function HeroMetric({ value, label, icon: Icon }: { value: number; label: string; icon: typeof Users }) {
  return <div className="relative px-2 py-5 text-center after:absolute after:inset-y-4 after:right-0 after:w-px after:bg-[#173b32]/10 last:after:hidden sm:px-6 sm:py-7"><Icon className="mx-auto mb-2 size-4 text-[#23705d] sm:size-5" /><strong className="block text-xl font-black tracking-tight sm:text-3xl">{value.toLocaleString("es-PY")}</strong><span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#6f7d77] sm:text-xs">{label}</span></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`h-10 rounded-xl px-3 text-xs font-black transition sm:h-11 sm:px-4 ${active ? "bg-[#153d33] text-white shadow-sm" : "text-[#52635c] hover:bg-white/70"}`}>{children}</button>;
}

function CircuitCard({ circuit, featured }: { circuit: PublicCircuit; featured: boolean }) {
  const active = circuit.status === "activo";
  const modality = circuit.modality === "online" ? "Online" : circuit.modality === "hibrido" ? "Híbrido" : "Presencial";
  return (
    <Link href={`/circuitos/${circuit.slug}`} className={`group relative flex min-h-72 flex-col overflow-hidden rounded-[1.75rem] border p-5 transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#287561]/30 sm:min-h-80 sm:p-7 ${featured ? "border-[#1c5b4a] bg-[#123b31] text-white shadow-[0_20px_55px_rgba(17,55,46,0.18)]" : "border-[#173b32]/10 bg-white shadow-[0_14px_35px_rgba(17,51,43,0.07)] hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(17,51,43,0.12)]"}`}>
      <div className={`absolute -bottom-16 -right-8 select-none text-[13rem] leading-none transition duration-500 group-hover:-rotate-6 group-hover:scale-105 ${featured ? "text-white/[0.055]" : "text-[#163d33]/[0.035]"}`} aria-hidden="true">♞</div>
      <div className="relative flex items-start justify-between gap-3">
        <Badge className={active ? "bg-[#d9f55f] text-[#12352d]" : featured ? "bg-white/10 text-white" : "bg-[#e8ece9] text-[#44534d]"}>{active ? <CircleDot className="size-3" /> : <Check className="size-3" />}{active ? "En juego" : "Finalizado"}</Badge>
        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${featured ? "bg-white/10 text-emerald-100" : "bg-[#f2eee5] text-[#68766f]"}`}>{circuit.season}</span>
      </div>
      <div className="relative mt-auto pt-12">
        <div className={`mb-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider ${featured ? "text-emerald-100/70" : "text-[#68766f]"}`}><span>{circuit.categoryScheme === "impares" ? "Categorías impares" : "Categorías pares"}</span><span aria-hidden="true">•</span><span>{modality}</span></div>
        <h3 className="max-w-lg text-2xl font-black leading-[1.05] tracking-[-0.035em] sm:text-3xl">{circuit.name}</h3>
        <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold ${featured ? "text-emerald-100/75" : "text-[#5e6d67]"}`}><MapPin className="size-3.5" /> <span className="truncate">{circuit.location || "Paraguay"}</span></div>
        <div className={`mt-5 grid grid-cols-3 gap-2 border-t pt-4 ${featured ? "border-white/10" : "border-[#173b32]/10"}`}><CardMetric value={circuit.tournamentCount} label="fechas" /><CardMetric value={circuit.playerCount} label="jugadores" /><CardMetric value={circuit.resultCount} label="resultados" /></div>
        <div className={`mt-5 flex items-center justify-between text-sm font-black ${featured ? "text-[#d9f55f]" : "text-[#1c6754]"}`}>Entrar al circuito <span className={`flex size-9 items-center justify-center rounded-full transition group-hover:translate-x-1 ${featured ? "bg-[#d9f55f] text-[#12352d]" : "bg-[#e4eee9]"}`}><ChevronRight className="size-4" /></span></div>
      </div>
    </Link>
  );
}

function CardMetric({ value, label }: { value: number; label: string }) {
  return <div><strong className="block text-base font-black sm:text-lg">{value.toLocaleString("es-PY")}</strong><span className="block text-[9px] font-bold uppercase tracking-wide opacity-60 sm:text-[10px]">{label}</span></div>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <li className="rounded-2xl border border-[#173b32]/10 bg-[#f6f2e9] p-5"><span className="text-xs font-black tracking-[0.18em] text-[#23705d]">{number}</span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-1 text-sm leading-relaxed text-[#64726c]">{text}</p></li>;
}
