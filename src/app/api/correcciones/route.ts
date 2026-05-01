import { NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { correctImportedResult } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      resultId?: string;
      place?: number | null;
      branchId?: "absoluto" | "femenino";
      playerName?: string;
      schoolName?: string;
      tournamentPoints?: number;
      tieBreaks?: Record<string, number | string>;
    };

    if (payload.branchId !== "absoluto" && payload.branchId !== "femenino") {
      return Response.json({ error: "Seleccione una rama valida." }, { status: 422 });
    }

    const result = await correctImportedResult(
      {
        resultId: payload.resultId ?? "",
        place: payload.place ?? null,
        branchId: payload.branchId,
        playerName: payload.playerName ?? "",
        schoolName: payload.schoolName ?? "",
        tournamentPoints: Number(payload.tournamentPoints ?? 0),
        tieBreaks: payload.tieBreaks ?? {},
      },
      "admin",
    );

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo corregir el resultado." },
      { status: 400 },
    );
  }
}
