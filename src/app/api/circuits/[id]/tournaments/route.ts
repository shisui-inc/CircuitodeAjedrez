import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { createTournament } from "@/lib/server/repository";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await hasAdminSession(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    if (!body.name?.trim() || !body.date || !Number.isInteger(Number(body.round)) || Number(body.round) < 1) {
      return NextResponse.json({ error: "Nombre, número y fecha son obligatorios." }, { status: 400 });
    }
    const tournament = await createTournament(id, { name: body.name, round: Number(body.round), date: body.date });
    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo agregar la fecha." }, { status: 500 });
  }
}
