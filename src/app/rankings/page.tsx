import type { Metadata } from "next";
import { PublicCircuitsHome } from "@/components/public-circuits-home";
import { getCircuitCatalog, getPublishedCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultados y rankings",
  description: "Encontrá torneos activos, resultados oficiales y rankings de ajedrez por categoría, rama y colegio.",
  alternates: { canonical: "/rankings" },
};

export default async function PublicCircuitsPage() {
  const catalog = (await getCircuitCatalog()).filter((circuit) => circuit.isPublished);
  const circuits = await Promise.all(
    catalog.map(async (circuit) => {
      const snapshot = await getPublishedCircuitSnapshot(circuit.id);
      return {
        ...circuit,
        tournamentCount: snapshot.dates.length,
        playerCount: new Set(snapshot.importedResults.map((result) => result.playerId)).size,
        resultCount: snapshot.importedResults.length,
      };
    }),
  );

  return <PublicCircuitsHome circuits={circuits} />;
}
