"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronDown, CircleDot, MapPin, Search, School, ShieldCheck, Trophy, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Branch, Category, Circuit, CircuitDate, IndividualRankingRow, SchoolRankingRow } from "@/lib/types";

interface RankingSection {
  id: string;
  category: Category;
  branch: Branch;
  rows: IndividualRankingRow[];
}

export function PublicCircuitView({
  circuit,
  dates,
  sections,
  schools,
}: {
  circuit: Circuit;
  dates: CircuitDate[];
  sections: RankingSection[];
  schools: SchoolRankingRow[];
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const playerMatches = useMemo(() => {
    if (!normalizedQuery) return [];
    const unique = new Map<string, { row: IndividualRankingRow; section: RankingSection }>();
    for (const section of sections) {
      for (const row of section.rows) {
        if (`${row.playerName} ${row.schoolName}`.toLocaleLowerCase("es").includes(normalizedQuery)) {
          unique.set(`${row.playerName}-${section.id}`, { row, section });
        }
      }
    }
    return [...unique.values()].slice(0, 20);
  }, [normalizedQuery, sections]);
  const players = new Set(sections.flatMap((section) => section.rows.map((row) => row.playerId))).size;
  const loadedDates = dates.filter((date) => date.status !== "pendiente").length;
  const modality = circuit.modality === "online" ? "Online" : circuit.modality === "hibrido" ? "Híbrido" : "Presencial";
  const categoryGroups = groupSectionsByCategory(sections);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#f4f0e5] text-[#14231f]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d2e27]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full text-white hover:bg-white/10 hover:text-white">
            <Link href="/rankings"><ArrowLeft className="size-4" /> Torneos</Link>
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-black text-emerald-100">{circuit.shortName}</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white p-1"><Image src="/logoflash.png" alt="" width={32} height={32} className="size-full object-contain" /></span>
          </div>
        </div>
      </header>

      <section className="relative isolate bg-[#10392f] px-4 pb-24 pt-9 text-white sm:px-6 sm:pb-28 sm:pt-14">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_85%_20%,rgba(217,245,95,0.18),transparent_30%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.045] [background-image:linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#fff_75%),linear-gradient(-45deg,transparent_75%,#fff_75%)] [background-position:0_0,0_20px,20px_-20px,-20px_0] [background-size:40px_40px]" />
        <div className="absolute -bottom-20 -right-14 -z-10 select-none text-[16rem] leading-none text-white/[0.035] sm:text-[22rem]" aria-hidden="true">♞</div>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={circuit.status === "finalizado" ? "bg-white/10 text-white" : "bg-[#d9f55f] text-[#10392f]"}>
              {circuit.status === "finalizado" ? <ShieldCheck className="size-3" /> : <CircleDot className="size-3" />}{circuit.status === "finalizado" ? "Circuito finalizado" : "En juego"}
            </Badge>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-100">{circuit.categoryScheme === "impares" ? "Categorías impares" : "Categorías pares"}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-100">{modality}</span>
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#d9f55f]">Temporada {circuit.season}</p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl">{circuit.name}</h1>
          <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-emerald-50/75 sm:text-base">{circuit.description}</p>
          <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-100"><MapPin className="size-4 text-[#d9f55f]" />{circuit.location || "Paraguay"}</p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 sm:px-6" aria-label="Resumen del circuito">
        <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_20px_60px_rgba(17,51,43,0.12)]">
          <Metric value={loadedDates} label="Fechas" icon={CalendarDays} />
          <Metric value={players} label="Jugadores" icon={Users} />
          <Metric value={schools.length} label="Colegios" icon={School} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
        <section className="rounded-[1.75rem] border border-[#173b32]/10 bg-[#e9e3d5] p-3 sm:p-5">
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#23705d]">Tu acceso directo</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Encontrá a un jugador</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre del jugador o colegio" className="h-14 rounded-2xl border-0 bg-white pl-12 pr-12 text-base shadow-none focus-visible:ring-[#287561]/30" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button> : null}
          </div>
          {normalizedQuery ? (
            <div className="mt-3 space-y-2">
              {playerMatches.length ? playerMatches.map(({ row, section }) => (
                <PlayerResult key={`${section.id}-${row.playerId}`} row={row} section={section} dates={dates} />
              )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-600">No encontramos coincidencias. Revisá el nombre e intentá de nuevo.</div>}
            </div>
          ) : null}
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#23705d]">Clasificación completa</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">Resultados por categoría</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#64726c]">Elegí la categoría y rama. Después tocá un jugador para ver cómo sumó en cada fecha.</p>
          <div className="mt-5 space-y-3">
            {categoryGroups.map((group, index) => (
              <details key={group.category.id} open={index === 0} className="group overflow-hidden rounded-3xl border border-[#173b32]/10 bg-white shadow-[0_10px_28px_rgba(17,51,43,0.06)]">
                <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5efe9] text-[#1e6c57]"><Trophy className="size-5" /></div>
                    <div className="min-w-0"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Categoría</p><h3 className="truncate text-lg font-black">{group.category.name}</h3><p className="text-xs font-semibold text-slate-500">{group.sections.reduce((total, section) => total + section.rows.length, 0)} resultados · 2 ramas</p></div>
                  </div>
                  <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-2 sm:p-4">
                  {group.sections.map((section) => <section key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rama</p><h4 className="font-black">{section.branch.name}</h4></div><Badge className={section.branch.id === "femenino" ? "bg-rose-100 text-rose-700" : "bg-[#e5efe9] text-[#1e6c57]"}>{section.rows.length} jugadores</Badge></div>{section.rows.length ? <div className="space-y-2 bg-slate-50/60 p-2">{section.rows.map((row) => <RankingRow key={row.playerId} row={row} dates={dates} />)}</div> : <p className="p-5 text-center text-sm text-slate-500">Sin resultados cargados en esta rama.</p>}</section>)}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#23705d]">Acumulado institucional</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">Ranking de colegios</h2>
          <div className="mt-5 space-y-2">{schools.map((row) => (
            <div key={row.schoolId} className="flex items-center gap-3 rounded-2xl border border-[#173b32]/10 bg-white p-4 shadow-[0_8px_24px_rgba(17,51,43,0.045)]">
              <RankMark rank={row.rank} />
              <div className="min-w-0 flex-1"><p className="truncate font-black">{row.schoolName}</p><p className="text-xs font-semibold text-slate-500">{row.playersWithPoints} jugadores · {row.datesWithPoints} fechas</p></div>
              <strong className="text-lg text-emerald-800">{row.totalPoints}<span className="ml-1 text-xs">pts</span></strong>
            </div>
          ))}</div>
        </section>
      </div>
      <footer className="bg-[#0d2e27] px-4 py-9 text-white sm:px-6"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><div><p className="font-black">Circuitos de Ajedrez</p><p className="text-xs text-emerald-100/55">Cada partida cuenta.</p></div><Button asChild variant="ghost" size="sm" className="rounded-full text-white hover:bg-white/10 hover:text-white"><Link href="/rankings">Ver otros torneos <ArrowLeft className="size-4" /></Link></Button></div></footer>
    </main>
  );
}

function Metric({ value, label, icon: Icon }: { value: number; label: string; icon: typeof Users }) {
  return <div className="relative px-2 py-5 text-center after:absolute after:inset-y-4 after:right-0 after:w-px after:bg-[#173b32]/10 last:after:hidden sm:px-6 sm:py-7"><Icon className="mx-auto mb-2 size-4 text-[#23705d] sm:size-5" /><strong className="block text-xl font-black sm:text-3xl">{value.toLocaleString("es-PY")}</strong><span className="block text-[10px] font-black uppercase tracking-[0.1em] text-[#6f7d77] sm:text-xs">{label}</span></div>;
}

function groupSectionsByCategory(sections: RankingSection[]) {
  const groups = new Map<string, { category: Category; sections: RankingSection[] }>();
  for (const section of sections) {
    const group = groups.get(section.category.id);
    if (group) group.sections.push(section);
    else groups.set(section.category.id, { category: section.category, sections: [section] });
  }
  return [...groups.values()];
}

function PlayerResult({ row, section, dates }: { row: IndividualRankingRow; section: RankingSection; dates: CircuitDate[] }) {
  return <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><RankMark rank={row.rank} /><div className="min-w-0 flex-1"><p className="font-black">{row.playerName}</p><p className="truncate text-xs font-semibold text-slate-500">{row.schoolName}</p><div className="mt-2 flex flex-wrap gap-2 text-xs font-bold"><Badge variant="secondary">{section.category.name}</Badge><Badge variant="secondary">{section.branch.name}</Badge></div></div><strong className="text-xl text-emerald-800">{row.totalPoints}<span className="ml-1 text-xs">pts</span></strong></div><DatePoints row={row} dates={dates} /></div>;
}

function RankingRow({ row, dates }: { row: IndividualRankingRow; dates: CircuitDate[] }) {
  return <details className="group/row rounded-xl border border-slate-200 bg-white"><summary className="flex cursor-pointer list-none items-center gap-3 p-3 marker:hidden sm:p-4"><RankMark rank={row.rank} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black sm:text-base">{row.playerName}</p><p className="truncate text-xs font-semibold text-slate-500">{row.schoolName}</p></div><strong className="whitespace-nowrap text-base text-emerald-800">{row.totalPoints} pts</strong><ChevronDown className="size-4 shrink-0 text-slate-400 transition group-open/row:rotate-180" /></summary><DatePoints row={row} dates={dates} /></details>;
}

function DatePoints({ row, dates }: { row: IndividualRankingRow; dates: CircuitDate[] }) {
  return <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 sm:grid-cols-3">{dates.map((date) => <div key={date.id} className="rounded-lg bg-slate-50 px-3 py-2"><p className="truncate text-[11px] font-bold text-slate-500">{date.name}</p><p className="text-sm font-black">{row.pointsByDate[date.id] ?? 0} pts</p></div>)}</div>;
}

function RankMark({ rank }: { rank: number }) {
  const podium = rank <= 3;
  return <div aria-label={`Puesto ${rank}`} className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${podium ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{rank}°</div>;
}
