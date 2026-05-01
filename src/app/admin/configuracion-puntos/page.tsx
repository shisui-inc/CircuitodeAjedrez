import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PointRulesPanel } from "@/components/point-rules-panel";
import { getCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function PointRulesPage() {
  const snapshot = await getCircuitSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Configuracion de puntos</h2>
        <p className="text-sm text-muted-foreground">Solo puntuan los 10 primeros de cada categoria y rama.</p>
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Regla activa</CardTitle>
          <CardDescription>Estos valores se aplican al confirmar una importacion.</CardDescription>
        </CardHeader>
        <CardContent>
          <PointRulesPanel rules={snapshot.pointRules} />
        </CardContent>
      </Card>
    </div>
  );
}
