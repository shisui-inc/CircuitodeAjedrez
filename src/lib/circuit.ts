import type { Branch, Category, CategoryScheme, PointRule } from "@/lib/types";

export const EVEN_CATEGORIES: Category[] = [
  { id: "sub-6", name: "Sub 6", sortOrder: 1 },
  { id: "sub-8", name: "Sub 8", sortOrder: 2 },
  { id: "sub-10", name: "Sub 10", sortOrder: 3 },
  { id: "sub-12", name: "Sub 12", sortOrder: 4 },
  { id: "sub-14", name: "Sub 14", sortOrder: 5 },
  { id: "abierto", name: "Abierto", sortOrder: 6 },
];

export const ODD_CATEGORIES: Category[] = [
  { id: "sub-7", name: "Sub 7", sortOrder: 1 },
  { id: "sub-9", name: "Sub 9", sortOrder: 2 },
  { id: "sub-11", name: "Sub 11", sortOrder: 3 },
  { id: "sub-13", name: "Sub 13", sortOrder: 4 },
  { id: "abierto", name: "Abierto", sortOrder: 5 },
];

export const ALL_CATEGORIES: Category[] = [
  ...EVEN_CATEGORIES.filter((category) => category.id !== "abierto"),
  ...ODD_CATEGORIES.filter((category) => category.id !== "abierto"),
  { id: "abierto", name: "Abierto", sortOrder: 99 },
];

export const CATEGORIES = EVEN_CATEGORIES;

export function getCategoriesForScheme(scheme: CategoryScheme) {
  return structuredClone(scheme === "impares" ? ODD_CATEGORIES : EVEN_CATEGORIES);
}

export const BRANCHES: Branch[] = [
  { id: "absoluto", name: "Absoluto", sortOrder: 1 },
  { id: "femenino", name: "Femenino", sortOrder: 2 },
];

export const DEFAULT_POINT_RULES: PointRule[] = [
  { place: 1, points: 12 },
  { place: 2, points: 11 },
  { place: 3, points: 10 },
  { place: 4, points: 9 },
  { place: 5, points: 8 },
  { place: 6, points: 7 },
  { place: 7, points: 6 },
  { place: 8, points: 5 },
  { place: 9, points: 4 },
  { place: 10, points: 3 },
];

export function getCategoryName(categoryId: string) {
  return ALL_CATEGORIES.find((category) => category.id === categoryId)?.name ?? categoryId;
}

export function getBranchName(branchId: string) {
  return BRANCHES.find((branch) => branch.id === branchId)?.name ?? branchId;
}

export function getCircuitPoints(place: number | null | undefined, rules = DEFAULT_POINT_RULES) {
  if (!place) {
    return 0;
  }

  return rules.find((rule) => rule.place === place)?.points ?? 0;
}
