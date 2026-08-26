import { describe, expect, it } from "vitest";
import { getCategoriesForScheme, getCategoryName } from "@/lib/circuit";

describe("esquemas de categorías", () => {
  it("crea el esquema Par con categorías pares y Abierto", () => {
    expect(getCategoriesForScheme("pares").map((category) => category.id)).toEqual([
      "sub-6",
      "sub-8",
      "sub-10",
      "sub-12",
      "sub-14",
      "abierto",
    ]);
  });

  it("crea el esquema Impar definido por la guía", () => {
    expect(getCategoriesForScheme("impares").map((category) => category.id)).toEqual([
      "sub-7",
      "sub-9",
      "sub-11",
      "sub-13",
      "abierto",
    ]);
  });

  it("resuelve los nombres de categorías pares e impares", () => {
    expect(getCategoryName("sub-8")).toBe("Sub 8");
    expect(getCategoryName("sub-11")).toBe("Sub 11");
  });
});
