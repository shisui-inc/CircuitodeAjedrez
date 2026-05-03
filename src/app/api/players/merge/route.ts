import { NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { mergePlayers } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      sourcePlayerId?: string;
      targetPlayerId?: string;
    };

    const result = await mergePlayers(
      {
        sourcePlayerId: payload.sourcePlayerId ?? "",
        targetPlayerId: payload.targetPlayerId ?? "",
      },
      "admin",
    );

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo fusionar el jugador." },
      { status: 400 },
    );
  }
}
