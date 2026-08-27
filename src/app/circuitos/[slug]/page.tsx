import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PublicCircuitView } from "@/components/public-circuit-view";
import { computeIndividualRankings, computeSchoolRankings } from "@/lib/rankings";
import { getCircuitBySlug, getPublishedCircuitSnapshot } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

const getCircuit = cache(getCircuitBySlug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const circuit = await getCircuit(slug);
  if (!circuit?.isPublished) return {};

  const description = circuit.description || `Resultados y rankings oficiales de ${circuit.name}.`;
  const images = circuit.logoUrl ? [circuit.logoUrl] : [];
  return {
    title: circuit.name,
    description,
    alternates: { canonical: `/circuitos/${circuit.slug}` },
    openGraph: { title: circuit.name, description, url: `/circuitos/${circuit.slug}`, images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title: circuit.name, description, images },
  };
}

export default async function CircuitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const circuit = await getCircuit(slug);

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
