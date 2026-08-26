import { notFound } from "next/navigation";
import { PublicCircuitView } from "@/components/public-circuit-view";
import { computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { getCircuitBySlug, getPublishedCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

export default async function CircuitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const circuit = await getCircuitBySlug(slug);

  if (!circuit?.isPublished) notFound();

  const snapshot = await getPublishedCircuitSnapshot(circuit.id);
  const dates = snapshot.dates.toSorted((a, b) => a.round - b.round);
  const sections = snapshot.categories
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((category) =>
      snapshot.branches.toSorted((a, b) => a.sortOrder - b.sortOrder).map((branch) => ({
        id: `${category.id}-${branch.id}`,
        category,
        branch,
        rows: computeIndividualRankings(snapshot, { categoryId: category.id, branchId: branch.id }),
      })),
    );

  return (
    <PublicCircuitView
      circuit={circuit}
      dates={dates}
      sections={sections}
      schools={computeSchoolRankings(snapshot)}
    />
  );
}
