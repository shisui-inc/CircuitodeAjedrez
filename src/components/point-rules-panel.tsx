"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PointRule } from "@/lib/types";

export function PointRulesPanel({ rules }: { rules: PointRule[] }) {
  const [localRules, setLocalRules] = useState(rules);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateRule(place: number, points: number) {
    setLocalRules((currentRules) =>
      currentRules.map((rule) => (rule.place === place ? { ...rule, points } : rule)),
    );
    setMessage("Cambios pendientes de guardar.");
  }

  async function saveRules() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/point-rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rules: localRules }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudieron guardar las reglas.");
      }

      setMessage(payload.message ?? "Reglas guardadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron guardar las reglas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Puesto</TableHead>
              <TableHead>Puntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localRules.map((rule) => (
              <TableRow key={rule.place}>
                <TableCell className="font-medium">{rule.place}</TableCell>
                <TableCell>
                  <Input
                    className="w-28"
                    inputMode="numeric"
                    value={rule.points}
                    onChange={(event) => updateRule(rule.place, Number(event.target.value) || 0)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={saveRules} disabled={loading}>
          <Save className="size-4" />
          Guardar reglas
        </Button>
        <Button variant="outline" onClick={() => setLocalRules(rules)}>
          <RotateCcw className="size-4" />
          Restaurar
        </Button>
      </div>
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
    </div>
  );
}
