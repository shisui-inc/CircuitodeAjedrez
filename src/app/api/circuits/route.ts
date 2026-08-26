import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { createCircuit } from "@/lib/server/repository";

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    const body = await request.json();
    if (!body.name?.trim() || !body.season?.trim()) {
      return NextResponse.json({ error: "Nombre y temporada son obligatorios." }, { status: 400 });
    }
    if (!(["pares", "impares"] as const).includes(body.categoryScheme ?? "pares")) {
      return NextResponse.json({ error: "El esquema debe ser Pares o Impares." }, { status: 400 });
    }
    if (!(["online", "presencial", "hibrido"] as const).includes(body.modality ?? "presencial")) {
      return NextResponse.json({ error: "Modalidad inválida." }, { status: 400 });
    }
    const circuit = await createCircuit({
      name: body.name,
      shortName: body.shortName ?? body.name,
      season: body.season,
      location: body.location ?? "",
      description: body.description ?? "",
      categoryScheme: body.categoryScheme ?? "pares",
      modality: body.modality ?? "presencial",
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      logoUrl: body.logoUrl,
      instagramUrl: body.instagramUrl,
      facebookUrl: body.facebookUrl,
    });
    return NextResponse.json({ circuit }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear el circuito." }, { status: 500 });
  }
}
