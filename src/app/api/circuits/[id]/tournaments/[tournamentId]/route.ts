import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { deleteImportedDate, updateTournament } from "@/lib/server/repository";
import type { CircuitDate } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tournamentId: string }> },
) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id, tournamentId } = await params;
    const body = (await request.json()) as Partial<CircuitDate>;
    const patch: Partial<Pick<CircuitDate, "name" | "round" | "date" | "status">> = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
      patch.name = body.name.trim();
    }
    if (body.round !== undefined) {
      const round = Number(body.round);
      if (!Number.isInteger(round) || round < 1) {
        return NextResponse.json({ error: "El número de fecha debe ser mayor a cero." }, { status: 400 });
      }
      patch.round = round;
    }
    if (body.date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        return NextResponse.json({ error: "La fecha no es válida." }, { status: 400 });
      }
      patch.date = body.date;
    }
    if (body.status !== undefined) {
      if (!(["pendiente", "importada", "cerrada"] as const).includes(body.status)) {
        return NextResponse.json({ error: "Estado de fecha no válido." }, { status: 400 });
      }
      patch.status = body.status;
    }

    const tournament = await updateTournament(id, tournamentId, patch, "admin");
    return NextResponse.json({ tournament });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar la fecha." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tournamentId: string }> },
) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id, tournamentId } = await params;
    const body = (await request.json()) as { confirmation?: string };
    if (body.confirmation !== "BORRAR") {
      return NextResponse.json({ error: "Confirmación inválida." }, { status: 422 });
    }

    await updateTournament(id, tournamentId, { status: "pendiente" }, "admin");
    const result = await deleteImportedDate(tournamentId, "admin");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo limpiar la fecha." },
      { status: 400 },
    );
  }
}
