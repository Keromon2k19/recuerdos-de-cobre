import { describe, it, expect } from "vitest";
import { slugify, episodeFilename } from "@/lib/slugify";

describe("slugify", () => {
  it("convierte espacios a guiones", () => {
    expect(slugify("Bosque de Espinas")).toBe("bosque-de-espinas");
  });

  it("remueve acentos (NFD)", () => {
    expect(slugify("Té de Medianoche")).toBe("te-de-medianoche");
    expect(slugify("Versión")).toBe("version");
  });

  it("elimina signos de exclamación y otra puntuación", () => {
    expect(slugify("¡Mysha!")).toBe("mysha");
  });

  it("elimina paréntesis y los reemplaza por separación con guion", () => {
    expect(slugify("Coven (Rosa)")).toBe("coven-rosa");
  });

  it("colapsa múltiples guiones consecutivos", () => {
    expect(slugify("a -- b -- c")).toBe("a-b-c");
  });

  it("trimea guiones extremos", () => {
    expect(slugify(" --hola-- ")).toBe("hola");
  });

  it("maneja la ñ descomponiéndola en n (pierde la tilde)", () => {
    // Comportamiento real: NFD descompone ñ → n + tilde combinante,
    // y la tilde combinante se elimina por el regex de diacríticos.
    expect(slugify("España")).toBe("espana");
    expect(slugify("año nuevo")).toBe("ano-nuevo");
  });

  it("acepta números", () => {
    expect(slugify("Episodio 67")).toBe("episodio-67");
  });

  it("devuelve string vacío para input vacío", () => {
    expect(slugify("")).toBe("");
  });

  it("devuelve string vacío si solo hay puntuación", () => {
    expect(slugify("¡!¿?")).toBe("");
  });

  it("convierte todo a minúsculas", () => {
    expect(slugify("MYSHA Y SELENNE")).toBe("mysha-y-selenne");
  });
});

describe("episodeFilename", () => {
  it("padea el número a 3 dígitos", () => {
    expect(episodeFilename(7, "El altar")).toBe("007-el-altar.md");
  });

  it("slugifica el título", () => {
    expect(episodeFilename(67, "La hoguera")).toBe("067-la-hoguera.md");
  });

  it("maneja números mayores a 999 sin truncar", () => {
    expect(episodeFilename(1234, "X")).toBe("1234-x.md");
  });

  it("omite el sufijo cuando el título es vacío", () => {
    expect(episodeFilename(5, "")).toBe("005.md");
  });

  it("omite el sufijo cuando el título slugifica a vacío (solo puntuación)", () => {
    expect(episodeFilename(12, "¡!¿?")).toBe("012.md");
  });

  it("conserva acentos slugificados en el filename", () => {
    expect(episodeFilename(3, "Té de Medianoche")).toBe(
      "003-te-de-medianoche.md"
    );
  });

  it("padea 0 a 000", () => {
    expect(episodeFilename(0, "Prólogo")).toBe("000-prologo.md");
  });
});
