import { AuditPanel } from "@/components/audit-panel";
import { buildDataAudit } from "@/lib/audit";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const snapshot = await getCircuitSnapshot();
  const audit = buildDataAudit(snapshot);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Auditoria</h2>
        <p className="text-sm text-muted-foreground">
          Control de puntos, duplicados, referencias y consistencia antes de publicar rankings.
        </p>
      </div>
      <AuditPanel audit={audit} />
    </div>
  );
}
