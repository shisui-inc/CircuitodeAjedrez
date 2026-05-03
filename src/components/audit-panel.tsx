"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, GitMerge, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DataAudit, DuplicatePlayerGroup } from "@/lib/audit";

interface AuditPanelProps {
  audit: DataAudit;
}

export function AuditPanel({ audit }: AuditPanelProps) {
  const router = useRouter();
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState("");
  const [status, setStatus] = useState<{ variant: "success" | "error" | "info"; message: string } | null>(null);
  const defaultTargets = useMemo(() => getDefaultTargets(audit.duplicatePlayerGroups), [audit.duplicatePlayerGroups]);

  function targetFor(group: DuplicatePlayerGroup) {
    return selectedTargets[group.normalizedName] ?? defaultTargets[group.normalizedName] ?? group.players[0]?.id ?? "";
  }

  async function mergePlayer(group: DuplicatePlayerGroup, sourcePlayerId: string) {
    const targetPlayerId = targetFor(group);
    if (!targetPlayerId || sourcePlayerId === targetPlayerId) {
      setStatus({ variant: "error", message: "Seleccione un jugador origen distinto del destino." });
      return;
    }

    setBusyKey(`${group.normalizedName}-${sourcePlayerId}`);
    setStatus({ variant: "info", message: "Fusionando jugador..." });

    try {
      const response = await fetch("/api/players/merge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourcePlayerId, targetPlayerId }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo fusionar el jugador.");
      }

      setStatus({ variant: "success", message: payload.message ?? "Jugador fusionado." });
      router.refresh();
    } catch (error) {
      setStatus({ variant: "error", message: error instanceof Error ? error.message : "No se pudo fusionar el jugador." });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Errores criticos" value={audit.summary.errors} tone={audit.summary.errors ? "error" : "success"} />
        <MetricCard label="Avisos" value={audit.summary.warnings} tone={audit.summary.warnings ? "warning" : "success"} />
        <MetricCard label="Duplicados de jugadores" value={audit.summary.duplicatePlayerGroups} tone={audit.summary.duplicatePlayerGroups ? "warning" : "success"} />
        <MetricCard
          label="Puntos formula / guardados"
          value={`${audit.summary.totalExpectedPoints} / ${audit.summary.totalMaterializedPoints}`}
          tone={audit.summary.totalExpectedPoints === audit.summary.totalMaterializedPoints ? "success" : "error"}
        />
      </div>

      {status ? <p className={statusClassName(status.variant)}>{status.message}</p> : null}

      <Card className="rounded-lg">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Estado general</CardTitle>
            <CardDescription>Comparacion de integridad, puntos y datos cargados en Supabase.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.refresh()}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryBox label="Resultados" value={audit.summary.importedResults} />
            <SummaryBox label="Puntos guardados" value={audit.summary.circuitPoints} />
            <SummaryBox label="Filas puntuantes" value={audit.summary.expectedPointRows} />
            <SummaryBox label="Tablas cargadas" value={audit.scopes.length} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Problemas detectados</CardTitle>
          <CardDescription>Los errores deben resolverse antes de publicar cambios de rankings.</CardDescription>
        </CardHeader>
        <CardContent>
          {audit.issues.length ? (
            <div className="space-y-2">
              {audit.issues.map((issue, index) => (
                <div
                  key={`${issue.type}-${index}`}
                  className={issue.severity === "error" ? "rounded-lg bg-red-50 p-3 text-sm text-red-900" : "rounded-lg bg-amber-50 p-3 text-sm text-amber-900"}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{issue.type}</p>
                      <p>{issue.message}</p>
                    </div>
                    <Badge variant={issue.severity === "error" ? "destructive" : "secondary"}>{issue.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="size-4" />
              No se detectaron errores de integridad ni puntos desfasados.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Posibles jugadores duplicados</CardTitle>
          <CardDescription>
            Fusionar mueve resultados y puntos al jugador destino. Si ambos ya tienen resultados en la misma fecha/categoria/rama, la app bloquea la fusion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {audit.duplicatePlayerGroups.length ? (
            audit.duplicatePlayerGroups.map((group) => {
              const targetPlayerId = targetFor(group);
              return (
                <div key={group.normalizedName} className="rounded-lg border bg-white">
                  <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold">{group.normalizedName}</p>
                      <p className="text-sm text-muted-foreground">
                        {group.players.length} registros, {group.totalResults} resultados, {group.totalPoints} puntos.
                      </p>
                    </div>
                    <div className="min-w-64 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Jugador destino</p>
                      <Select
                        value={targetPlayerId}
                        onValueChange={(value) => setSelectedTargets((current) => ({ ...current, [group.normalizedName]: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {group.players.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.fullName} - {player.schoolName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jugador</TableHead>
                          <TableHead>Colegio</TableHead>
                          <TableHead className="text-right">Resultados</TableHead>
                          <TableHead className="text-right">Puntos</TableHead>
                          <TableHead className="text-right">Accion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.players.map((player) => {
                          const isTarget = player.id === targetPlayerId;
                          const key = `${group.normalizedName}-${player.id}`;
                          return (
                            <TableRow key={player.id}>
                              <TableCell className="font-medium">{player.fullName}</TableCell>
                              <TableCell>{player.schoolName}</TableCell>
                              <TableCell className="text-right">{player.resultCount}</TableCell>
                              <TableCell className="text-right">{player.points}</TableCell>
                              <TableCell className="text-right">
                                {isTarget ? (
                                  <Badge variant="secondary">Destino</Badge>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => mergePlayer(group, player.id)} disabled={Boolean(busyKey)}>
                                    <GitMerge className="size-4" />
                                    {busyKey === key ? "Fusionando" : "Fusionar"}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">No hay jugadores duplicados por nombre normalizado.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Puntos por fecha, categoria y rama</CardTitle>
          <CardDescription>La columna esperado debe coincidir con los puntos guardados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Rama</TableHead>
                  <TableHead className="text-right">Resultados</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Guardado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.scopes.map((scope) => (
                  <TableRow key={`${scope.tournamentId}-${scope.categoryId}-${scope.branchId}`}>
                    <TableCell>{scope.tournamentId}</TableCell>
                    <TableCell>{scope.categoryId}</TableCell>
                    <TableCell>{scope.branchId}</TableCell>
                    <TableCell className="text-right">{scope.results}</TableCell>
                    <TableCell className="text-right">{scope.expectedPoints}</TableCell>
                    <TableCell className="text-right font-semibold">{scope.materializedPoints}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDefaultTargets(groups: DuplicatePlayerGroup[]) {
  return Object.fromEntries(
    groups.map((group) => {
      const target = [...group.players].sort((a, b) => b.resultCount - a.resultCount || b.points - a.points || a.schoolName.localeCompare(b.schoolName, "es"))[0];
      return [group.normalizedName, target?.id ?? ""];
    }),
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number | string; tone: "success" | "warning" | "error" }) {
  const className =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-950"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-emerald-200 bg-emerald-50 text-emerald-950";

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function statusClassName(variant: "success" | "error" | "info") {
  if (variant === "error") {
    return "rounded-md bg-red-50 p-3 text-sm text-red-800";
  }

  if (variant === "success") {
    return "rounded-md bg-emerald-50 p-3 text-sm text-emerald-800";
  }

  return "rounded-md bg-sky-50 p-3 text-sm text-sky-800";
}
