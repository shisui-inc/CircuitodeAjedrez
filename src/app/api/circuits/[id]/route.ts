import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { updateCircuit } from "@/lib/server/repository";
import type { Circuit } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await hasAdminSession(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const { id } = await params;
    const body = (await request.json()) as Partial<Circuit>;
    if (body.categoryScheme && !(["pares", "impares"] as const).includes(body.categoryScheme)) {
      return NextResponse.json({ error: "El esquema debe ser Pares o Impares." }, { status: 400 });
    }
    if (body.modality && !(["online", "presencial", "hibrido"] as const).includes(body.modality)) {
      return NextResponse.json({ error: "Modalidad inválida." }, { status: 400 });
    }
    const circuit = await updateCircuit(id, {
      name: body.name,
      shortName: body.shortName,
      season: body.season,
      location: body.location,
      description: body.description,
      categoryScheme: body.categoryScheme,
      modality: body.modality,
      logoUrl: body.logoUrl,
      instagramUrl: body.instagramUrl,
      facebookUrl: body.facebookUrl,
      status: body.status,
      isPublished: body.isPublished,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    });
    return NextResponse.json({ circuit });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar el circuito." }, { status: 500 });
  }
}
