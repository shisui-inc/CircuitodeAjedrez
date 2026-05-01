import { NextRequest } from "next/server";
import { hasAdminSession } from "@/lib/server/auth";
import { deleteImportedDate } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  if (!(await hasAdminSession(request))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { tournamentId?: string; confirmation?: string };

    if (!payload.tournamentId) {
      return Response.json({ error: "Seleccione una fecha." }, { status: 422 });
    }

    if (payload.confirmation !== "BORRAR") {
      return Response.json({ error: "Escriba BORRAR para confirmar la eliminacion." }, { status: 422 });
    }

    const result = await deleteImportedDate(payload.tournamentId, "admin");
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudieron borrar los datos de la fecha." },
      { status: 400 },
    );
  }
}
