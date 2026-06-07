import { describe, expect, it } from "vitest";
import { characterMatchesSearch } from "@/lib/atlas-v2-character-search";

const rylen = {
  nombre: "Rylen",
  slug: "rylen",
  rol: "PJ",
  facciones: ["Grupo de Mysha"],
  aliases: ["Raylen", "Tirador Blanco"],
};

describe("atlas-v2 character search", () => {
  it("encuentra personajes por alias aunque el nombre canonico sea distinto", () => {
    expect(characterMatchesSearch(rylen, "raylen")).toBe(true);
    expect(characterMatchesSearch(rylen, "tirador blanco")).toBe(true);
  });

  it("sigue buscando por nombre, slug, rol y faccion", () => {
    expect(characterMatchesSearch(rylen, "Rylen")).toBe(true);
    expect(characterMatchesSearch(rylen, "pj")).toBe(true);
    expect(characterMatchesSearch(rylen, "grupo de mysha")).toBe(true);
  });

  it("ignora acentos y mayusculas", () => {
    expect(characterMatchesSearch(rylen, "GRUPO DE MYSHA")).toBe(true);
  });
});
