import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Crown, Medal, School, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { getCircuitSnapshot } from "@/lib/server/repository";
import { SOFTWARE_VERSION } from "@/lib/software-version";
import type { Branch, Category, CircuitDate, IndividualRankingRow, SchoolRankingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const categoryAccent = [
  "border-sky-200 bg-sky-50 text-sky-950 shadow-sky-200/70",
  "border-pink-200 bg-pink-50 text-pink-950 shadow-pink-200/70",
  "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-200/70",
  "border-amber-200 bg-amber-50 text-amber-950 shadow-amber-200/70",
  "border-violet-200 bg-violet-50 text-violet-950 shadow-violet-200/70",
  "border-cyan-200 bg-cyan-50 text-cyan-950 shadow-cyan-200/70",
];

export default async function PublicRankingsPage() {
  const snapshot = await getCircuitSnapshot();
  const schoolRows = computeSchoolRankings(snapshot);
  const dates = snapshot.dates.sort((a, b) => a.round - b.round);
  const sections = snapshot.categories.flatMap((category, categoryIndex) =>
    snapshot.branches.map((branch) => {
      const rows = computeIndividualRankings(snapshot, { categoryId: category.id, branchId: branch.id });

      return {
        id: `${category.id}-${branch.id}`,
        category,
        branch,
        rows,
        accent: categoryAccent[categoryIndex % categoryAccent.length],
      };
    }),
  );

  const completedDates = snapshot.dates.filter((date) => date.status !== "pendiente").length;
  const totalPlayersWithPoints = computeIndividualRankings(snapshot).filter((row) => row.totalPoints > 0).length;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#eef2f7] text-slate-950">
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[length:32px_32px]"
        aria-hidden="true"
      />
      <section className="relative overflow-hidden border-b-4 border-slate-900 bg-[#f8fafc]">
        <div className="absolute inset-0 opacity-70" aria-hidden="true">
          <div className="h-full w-full bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[length:72px_72px] bg-[position:0_0,0_36px,36px_-36px,-36px_0] opacity-[0.055]" />
        </div>
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-8">
          <div className="flex min-h-[430px] flex-col justify-between gap-8">
            <nav className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border-2 border-slate-900 bg-white shadow-[0_4px_0_#0f172a]">
                  <Image
                    src="/logoflash.png"
                    alt="Circuito Escolar de Ajedrez"
                    width={88}
                    height={88}
                    className="h-16 w-16 object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-800">Software oficial</p>
                  <p className="text-xs font-semibold text-slate-600">del Circuito de Ajedrez Paranaense 2026</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Button asChild variant="outline" className="border-2 border-slate-900 bg-white font-bold shadow-[0_3px_0_#0f172a]">
                  <Link href="/login">
                    Admin
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
                <p className="text-right text-[11px] font-bold text-slate-500">Software versión: {SOFTWARE_VERSION}</p>
              </div>
            </nav>

            <div className="max-w-3xl">
              <Badge className="mb-4 border-2 border-slate-900 bg-amber-300 px-3 py-1 text-slate-950 shadow-[0_3px_0_#0f172a]">
                Rankings actualizados por fecha
              </Badge>
              <h1 className="text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                Circuito Escolar de Ajedrez Paranaense
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium text-slate-700">
                Resultados ordenados por categoria, rama y colegios. Elegi una division para ver el podio y el acumulado.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatPill label="Fechas cargadas" value={completedDates} />
              <StatPill label="Jugadores puntuantes" value={totalPlayersWithPoints} />
              <StatPill label="Colegios" value={schoolRows.length} />
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-full rounded-lg border-4 border-slate-900 bg-white p-4 shadow-[0_8px_0_#0f172a]">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border-2 border-slate-900 bg-[#f6f8fb]">
                <Image
                  src="/demoniocircuit.png"
                  alt="Logo oficial del Circuito de Ajedrez"
                  width={420}
                  height={420}
                  className="h-full w-full object-contain p-4"
                  priority
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-slate-500">X Circuito de Ajedrez Escolar</p>
                  <p className="text-xl font-black">Paranaense PAR 2026</p>
                </div>
                <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border-2 border-slate-900 bg-white text-[0px] shadow-[0_4px_0_#0f172a]">
                  <Image
                    src="/demoniocircuit.png"
                    alt="Logo oficial del Circuito de Ajedrez"
                    width={88}
                    height={88}
                    className="h-16 w-16 object-contain"
                  />
                  ♛
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <Sparkles className="size-5 text-emerald-700" />
          <h2 className="text-2xl font-black tracking-normal">Elegir categoria</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`group rounded-lg border-2 p-4 shadow-[0_5px_0_rgba(15,23,42,0.95)] transition hover:-translate-y-0.5 hover:shadow-[0_7px_0_rgba(15,23,42,0.95)] ${section.accent}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase opacity-70">{section.branch.name}</p>
                  <p className="text-2xl font-black">{section.category.name}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-xl shadow-[0_3px_0_#0f172a]">
                  {section.branch.id === "femenino" ? "♕" : "♚"}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm font-bold">
                <span>{section.rows.length} jugadores</span>
                <span className="inline-flex items-center gap-1">
                  Ver tabla
                  <ChevronRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </a>
          ))}
          <a
            href="#colegios"
            className="rounded-lg border-2 border-lime-200 bg-lime-50 p-4 text-lime-950 shadow-[0_5px_0_rgba(15,23,42,0.95)] transition hover:-translate-y-0.5 hover:shadow-[0_7px_0_rgba(15,23,42,0.95)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase opacity-70">General</p>
                <p className="text-2xl font-black">Colegios</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg border-2 border-slate-900 bg-white shadow-[0_3px_0_#0f172a]">
                <School className="size-6" />
              </div>
            </div>
            <p className="mt-4 text-sm font-bold">{schoolRows.length} instituciones con puntos</p>
          </a>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-4 pb-8 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-emerald-800">Cuadro de honor</p>
            <h2 className="text-3xl font-black tracking-normal">Mejores colocados por categoria</h2>
          </div>
          <Badge className="w-fit border-2 border-slate-900 bg-white px-3 py-1 text-slate-950 shadow-[0_3px_0_#0f172a]">
            Lideres actuales
          </Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <LeaderCard key={`leader-${section.id}`} section={section} dates={dates} />
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-4 pb-8 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-lime-800">Colegios destacados</p>
            <h2 className="text-3xl font-black tracking-normal">Top 4 colegios</h2>
          </div>
          <Badge className="w-fit border-2 border-slate-900 bg-lime-200 px-3 py-1 text-slate-950 shadow-[0_3px_0_#0f172a]">
            Acumulado institucional
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {schoolRows.slice(0, 4).map((row) => (
            <SchoolLeaderCard key={`school-leader-${row.schoolId}`} row={row} dates={dates} />
          ))}
        </div>
      </section>

      <section className="relative mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 lg:px-8">
        {sections.map((section) => (
          <RankingSection
            key={section.id}
            id={section.id}
            category={section.category}
            branch={section.branch}
            rows={section.rows}
            dates={dates}
            accent={section.accent}
          />
        ))}
        <SchoolSection rows={schoolRows} dates={dates} />
      </section>
    </main>
  );
}

function LeaderCard({
  section,
  dates,
}: {
  section: {
    id: string;
    category: Category;
    branch: Branch;
    rows: IndividualRankingRow[];
    accent: string;
  };
  dates: CircuitDate[];
}) {
  const leader = section.rows[0];
  const latestLoadedRound = leader ? getLatestLoadedRound(leader, dates) : null;

  return (
    <a
      href={`#${section.id}`}
      className={`group relative overflow-hidden rounded-lg border-2 border-slate-900 p-4 shadow-[0_6px_0_#0f172a] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_#0f172a] ${section.accent}`}
    >
      <div className="absolute -right-5 -top-6 text-8xl font-black opacity-10" aria-hidden="true">
        {section.branch.id === "femenino" ? "♕" : "♚"}
      </div>
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase opacity-70">
            Mejor {section.category.name} {section.branch.name}
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-normal">
            {leader ? leader.playerName : "Sin resultados"}
          </h3>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-white shadow-[0_3px_0_#0f172a]">
          <Crown className="size-6 text-amber-600" />
        </div>
      </div>
      {leader ? (
        <div className="relative mt-5 grid grid-cols-[1fr_auto] items-end gap-3">
          <div>
            <p className="line-clamp-2 text-sm font-bold text-slate-700">{leader.schoolName}</p>
            <p className="mt-2 text-xs font-black uppercase opacity-70">
              {leader.firstPlaces} primeros puestos · {leader.datesPlayed} fechas
            </p>
            <p className="mt-1 text-xs font-black uppercase text-emerald-800">
              Ultima fecha cargada: {latestLoadedRound ?? "-"}
            </p>
          </div>
          <div className="rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-center shadow-[0_3px_0_#0f172a]">
            <p className="text-2xl font-black">{leader.totalPoints}</p>
            <p className="text-[10px] font-black uppercase text-slate-500">pts</p>
          </div>
        </div>
      ) : (
        <div className="relative mt-5 rounded-lg border-2 border-dashed border-slate-400 bg-white/70 p-3 text-sm font-bold text-slate-600">
          Esta division todavia no tiene puntuantes.
        </div>
      )}
      <div className="relative mt-4 flex items-center justify-end text-sm font-black">
        Ver acumulado
        <ChevronRight className="size-4 transition group-hover:translate-x-1" />
      </div>
    </a>
  );
}

function getLatestLoadedRound(row: IndividualRankingRow, dates: CircuitDate[]) {
  const dateById = new Map(dates.map((date) => [date.id, date]));

  return Object.entries(row.pointsByDate)
    .filter(([, points]) => points > 0)
    .map(([dateId]) => dateById.get(dateId)?.round ?? 0)
    .sort((a, b) => b - a)[0] ?? null;
}

function SchoolLeaderCard({ row, dates }: { row: SchoolRankingRow; dates: CircuitDate[] }) {
  const latestLoadedRound = getLatestSchoolLoadedRound(row, dates);
  const tone =
    row.rank === 1
      ? "bg-lime-100"
      : row.rank === 2
        ? "bg-emerald-50"
        : row.rank === 3
          ? "bg-amber-50"
          : "bg-sky-50";

  return (
    <a
      href="#colegios"
      className={`group relative overflow-hidden rounded-lg border-2 border-slate-900 p-4 shadow-[0_6px_0_#0f172a] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_#0f172a] ${tone}`}
    >
      <div className="absolute -right-4 -top-5 text-8xl font-black opacity-10" aria-hidden="true">
        ♜
      </div>
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-lime-800">Colegio #{row.rank}</p>
          <h3 className="mt-1 text-xl font-black leading-tight tracking-normal">{row.schoolName}</h3>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-white shadow-[0_3px_0_#0f172a]">
          <School className="size-6 text-lime-700" />
        </div>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <MetricBox label="Puntos" value={row.totalPoints} />
        <MetricBox label="Alumnos" value={row.playersWithPoints} />
      </div>
      <div className="relative mt-4 text-xs font-black uppercase text-slate-700">
        {row.podiums} podios · Ultima fecha cargada: {latestLoadedRound ?? "-"}
      </div>
      <div className="relative mt-4 flex items-center justify-end text-sm font-black">
        Ver ranking colegios
        <ChevronRight className="size-4 transition group-hover:translate-x-1" />
      </div>
    </a>
  );
}

function MetricBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-center shadow-[0_3px_0_#0f172a]">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

function getLatestSchoolLoadedRound(row: SchoolRankingRow, dates: CircuitDate[]) {
  const dateById = new Map(dates.map((date) => [date.id, date]));

  return Object.entries(row.pointsByDate)
    .filter(([, points]) => points > 0)
    .map(([dateId]) => dateById.get(dateId)?.round ?? 0)
    .sort((a, b) => b - a)[0] ?? null;
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border-2 border-slate-900 bg-white px-4 py-3 shadow-[0_4px_0_#0f172a]">
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

function RankingSection({
  id,
  category,
  branch,
  rows,
  dates,
  accent,
}: {
  id: string;
  category: Category;
  branch: Branch;
  rows: IndividualRankingRow[];
  dates: CircuitDate[];
  accent: string;
}) {
  const topRows = rows.slice(0, 3);

  return (
    <Card id={id} className="scroll-mt-6 rounded-lg border-2 border-slate-900 bg-white shadow-[0_6px_0_#0f172a]">
      <CardHeader className={`border-b-2 border-slate-900 ${accent}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase opacity-70">{branch.name}</p>
            <CardTitle className="text-3xl font-black tracking-normal">{category.name}</CardTitle>
          </div>
          <Badge className="w-fit border-2 border-slate-900 bg-white text-slate-950 shadow-[0_3px_0_#0f172a]">
            {rows.length} puntuantes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {topRows.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {topRows.map((row) => (
              <PodiumCard key={row.playerId} row={row} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
            Todavia no hay resultados para esta categoria.
          </div>
        )}
        {rows.length ? <PublicRankingTable rows={rows} dates={dates} /> : null}
      </CardContent>
    </Card>
  );
}

function PodiumCard({ row }: { row: IndividualRankingRow }) {
  const tone =
    row.rank === 1
      ? "bg-amber-100"
      : row.rank === 2
        ? "bg-slate-100"
        : "bg-orange-100";

  return (
    <div className={`rounded-lg border-2 border-slate-900 p-4 shadow-[0_4px_0_#0f172a] ${tone}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-lg border-2 border-slate-900 bg-white shadow-[0_3px_0_#0f172a]">
          {row.rank === 1 ? <Crown className="size-6 text-amber-600" /> : <Medal className="size-6 text-slate-700" />}
        </div>
        <Badge className="border-2 border-slate-900 bg-slate-950 text-white">#{row.rank}</Badge>
      </div>
      <p className="text-lg font-black leading-tight">{row.playerName}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{row.schoolName}</p>
      <p className="mt-4 text-3xl font-black">{row.totalPoints} pts</p>
    </div>
  );
}

function PublicRankingTable({ rows, dates }: { rows: IndividualRankingRow[]; dates: CircuitDate[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border-2 border-slate-900">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-slate-950 text-white">
          <tr>
            <th className="px-3 py-3 text-left">#</th>
            <th className="px-3 py-3 text-left">Jugador</th>
            <th className="px-3 py-3 text-left">Colegio</th>
            <th className="px-3 py-3 text-right">Total</th>
            {dates.map((date) => (
              <th key={date.id} className="px-3 py-3 text-right">
                {date.name}
              </th>
            ))}
            <th className="px-3 py-3 text-right">Podios</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.playerId}-${row.categoryId}-${row.branchId}`} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
              <td className="px-3 py-3 font-black">{row.rank}</td>
              <td className="min-w-56 px-3 py-3 font-bold">{row.playerName}</td>
              <td className="min-w-56 px-3 py-3 text-slate-600">{row.schoolName}</td>
              <td className="px-3 py-3 text-right text-lg font-black">{row.totalPoints}</td>
              {dates.map((date) => (
                <td key={date.id} className="px-3 py-3 text-right font-semibold">
                  {row.pointsByDate[date.id] ?? 0}
                </td>
              ))}
              <td className="px-3 py-3 text-right font-semibold">{row.podiums}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SchoolSection({ rows, dates }: { rows: SchoolRankingRow[]; dates: CircuitDate[] }) {
  return (
    <Card id="colegios" className="scroll-mt-6 rounded-lg border-2 border-slate-900 bg-white shadow-[0_6px_0_#0f172a]">
      <CardHeader className="border-b-2 border-slate-900 bg-lime-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-lime-800">Despues de los jugadores</p>
            <CardTitle className="text-3xl font-black tracking-normal">Ranking y acumulado de colegios</CardTitle>
          </div>
          <Shield className="size-10 text-lime-700" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black tracking-normal">Ranking de colegios</h3>
              <p className="text-sm font-semibold text-slate-600">Ordenado por puntos totales, primeros puestos, podios y fechas con puntos.</p>
            </div>
            <Badge className="border-2 border-slate-900 bg-lime-200 text-slate-950 shadow-[0_3px_0_#0f172a]">
              {rows.length} colegios
            </Badge>
          </div>
          <div className="overflow-x-auto rounded-lg border-2 border-slate-900">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-3 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">Colegio</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right">1ros</th>
                  <th className="px-3 py-3 text-right">Podios</th>
                  <th className="px-3 py-3 text-right">Alumnos</th>
                  <th className="px-3 py-3 text-right">Fechas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`ranking-${row.schoolId}`} className="border-t border-slate-200 odd:bg-white even:bg-lime-50/40">
                    <td className="px-3 py-3 font-black">{row.rank}</td>
                    <td className="min-w-64 px-3 py-3 font-bold">{row.schoolName}</td>
                    <td className="px-3 py-3 text-right text-lg font-black">{row.totalPoints}</td>
                    <td className="px-3 py-3 text-right font-semibold">{row.firstPlaces}</td>
                    <td className="px-3 py-3 text-right font-semibold">{row.podiums}</td>
                    <td className="px-3 py-3 text-right font-semibold">{row.playersWithPoints}</td>
                    <td className="px-3 py-3 text-right font-semibold">{row.datesWithPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h3 className="text-xl font-black tracking-normal">Acumulado de colegios</h3>
            <p className="text-sm font-semibold text-slate-600">Detalle de puntos por fecha y total acumulado institucional.</p>
          </div>
        <div className="overflow-x-auto rounded-lg border-2 border-slate-900">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-3 py-3 text-left">#</th>
                <th className="px-3 py-3 text-left">Colegio</th>
                <th className="px-3 py-3 text-right">Total</th>
                {dates.map((date) => (
                  <th key={date.id} className="px-3 py-3 text-right">
                    {date.name}
                  </th>
                ))}
                <th className="px-3 py-3 text-right">Alumnos</th>
                <th className="px-3 py-3 text-right">Podios</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.schoolId} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
                  <td className="px-3 py-3 font-black">{row.rank}</td>
                  <td className="min-w-64 px-3 py-3 font-bold">{row.schoolName}</td>
                  <td className="px-3 py-3 text-right text-lg font-black">{row.totalPoints}</td>
                  {dates.map((date) => (
                    <td key={date.id} className="px-3 py-3 text-right font-semibold">
                      {row.pointsByDate[date.id] ?? 0}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right font-semibold">{row.playersWithPoints}</td>
                  <td className="px-3 py-3 text-right font-semibold">{row.podiums}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </section>
      </CardContent>
    </Card>
  );
}
