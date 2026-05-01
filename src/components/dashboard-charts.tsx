"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SchoolRankingRow } from "@/lib/types";

interface DateChartProps {
  data: Array<{ name: string; puntos: number; resultados: number }>;
}

interface SchoolChartProps {
  rows: SchoolRankingRow[];
}

export function DateActivityChart({ data }: DateChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(15, 23, 42, 0.06)" }} />
          <Bar dataKey="puntos" fill="#0f766e" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SchoolPointsChart({ rows }: SchoolChartProps) {
  const data = rows.slice(0, 6).map((row) => ({
    name: row.schoolName.replace("Colegio ", ""),
    puntos: row.totalPoints,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(15, 23, 42, 0.06)" }} />
          <Bar dataKey="puntos" fill="#2563eb" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
