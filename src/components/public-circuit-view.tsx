"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronDown, MapPin, Search, School, Trophy, Users, X } from "lucide-react";
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

  return (
    <main className="min-h-dvh bg-[#f4f1e8] pb-16 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#102f28]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-white hover:bg-white/10 hover:text-white">
            <Link href="/rankings"><ArrowLeft className="size-4" /> Circuitos</Link>
          </Button>
          <span className="truncate text-xs font-bold text-emerald-100">{circuit.shortName}</span>
        </div>
      </header>

      <section className="bg-[#102f28] px-4 pb-10 pt-8 text-white sm:px-6 sm:pb-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={circuit.status === "finalizado" ? "bg-white/15 text-white" : "bg-[#d9f65f] text-[#102f28]"}>
              {circuit.status === "finalizado" ? "Circuito finalizado" : "Circuito activo"}
            </Badge>
            <span className="text-sm font-bold text-emerald-100">Temporada {circuit.season}</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">{circuit.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50 sm:text-base">{circuit.description}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-100"><MapPin className="size-4" />{circuit.location}</p>
          <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
            <Metric value={loadedDates} label="Fechas" icon={CalendarDays} />
            <Metric value={players} label="Jugadores" icon={Users} />
            <Metric value={schools.length} label="Colegios" icon={School} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-9 px-4 py-8 sm:px-6 sm:py-10">
        <section>
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Búsqueda rápida</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Encontrá a un jugador</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre del jugador o colegio" className="h-14 rounded-2xl border-slate-200 bg-white pl-12 pr-12 text-base shadow-sm" />
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Clasificación completa</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Resultados por categoría y rama</h2>
          <p className="mt-2 text-sm text-slate-600">Abrí solamente la tarjeta que necesitás. Cada una muestra el acumulado y el detalle por fecha.</p>
          <div className="mt-5 space-y-3">
            {sections.map((section, index) => (
              <details key={section.id} open={index === 0} className="group overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-sm">
                <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${section.branch.id === "femenino" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"}`}><Trophy className="size-5" /></div>
                    <div className="min-w-0"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Rama {section.branch.name}</p><h3 className="truncate text-lg font-black">{section.category.name}</h3><p className="text-xs font-semibold text-slate-500">{section.rows.length} jugadores</p></div>
                  </div>
                  <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <div className="border-t border-slate-100 bg-slate-50/60 p-2 sm:p-4">
                  {section.rows.length ? <div className="space-y-2">{section.rows.map((row) => <RankingRow key={row.playerId} row={row} dates={dates} />)}</div> : <p className="p-5 text-center text-sm text-slate-500">Sin resultados cargados en esta división.</p>}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Acumulado institucional</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Ranking de colegios</h2>
          <div className="mt-5 space-y-2">{schools.map((row) => (
            <div key={row.schoolId} className="flex items-center gap-3 rounded-2xl border border-slate-900/10 bg-white p-4">
              <RankMark rank={row.rank} />
              <div className="min-w-0 flex-1"><p className="truncate font-black">{row.schoolName}</p><p className="text-xs font-semibold text-slate-500">{row.playersWithPoints} jugadores · {row.datesWithPoints} fechas</p></div>
              <strong className="text-lg text-emerald-800">{row.totalPoints}<span className="ml-1 text-xs">pts</span></strong>
            </div>
          ))}</div>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label, icon: Icon }: { value: number; label: string; icon: typeof Users }) {
  return <div className="rounded-2xl border border-white/15 bg-white/10 p-3 sm:p-4"><Icon className="mb-3 size-4 text-[#d9f65f]" /><strong className="block text-2xl font-black">{value}</strong><span className="text-xs font-bold text-emerald-100">{label}</span></div>;
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
