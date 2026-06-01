import { describe, expect, it } from "vitest";
import {
  episodioLabel,
  episodioLedger,
  parseEpisodioRef,
} from "@/lib/episode-number";

describe("episode-number", () => {
  it("deriva el episodio desde el titulo de YouTube, no desde el registro", () => {
    expect(
      parseEpisodioRef("Recuerdos de Cobre 8 parte 1: La Estatua de Hielo")
    ).toEqual({ ep: 8, parte: 1 });

    expect(
      episodioLedger(
        "Recuerdos de Cobre 2 Parte 2: Bajo la sombra del Tsunami",
        3
      )
    ).toEqual({ main: "Ep. 2", sub: "PARTE 2" });
  });

  it("acepta formatos con numero textual y decimales", () => {
    expect(
      parseEpisodioRef("Recuerdos de Cobre numero 25: A este dios si le rezo")
    ).toEqual({ ep: 25 });

    expect(episodioLabel("Recuerdos de Cobre 53.5: Lore con tesito", 66)).toBe(
      "Ep. 53.5"
    );
  });
});
