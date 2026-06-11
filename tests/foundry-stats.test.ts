// tests/foundry-stats.test.ts
import { describe, it, expect } from "vitest";
import { parseFoundryActor, type MemberStats } from "@/lib/foundry-stats";

// Actor mínimo estilo dnd5e 5.3.2 (recorte de la hoja real de Mysha).
const ACTOR = {
  name: "Mysha",
  type: "character",
  items: [
    { _id: "CLS1", type: "class", name: "Blood Witch", system: { levels: 14 } },
    { _id: "CLS2", type: "class", name: "Warlock", system: { levels: 3 } },
    { _id: "EQ1", type: "equipment", name: "Daga", system: {} },
  ],
  system: {
    abilities: {
      str: { value: 9 }, dex: { value: 12 }, con: { value: 18 },
      int: { value: 19 }, wis: { value: 15 }, cha: { value: 20 },
    },
    attributes: {
      ac: { flat: null, calc: "custom", formula: "17" },
      hp: { value: 148, max: 191, temp: 40 },
      movement: { walk: "30", units: "ft" },
      senses: { units: "ft", special: "Blood Sense 60", ranges: { darkvision: 60, blindsight: null, truesight: 0, tremorsense: 0 } },
    },
    details: { originalClass: "CLS1" },
    traits: {
      dr: { value: ["cold", "fire", "necrotic"], custom: "" },
      di: { value: [], custom: "" },
      ci: { value: [], custom: "sleep" },
      languages: { value: ["common", "draconic", "abyssal"], custom: "" },
    },
  },
};

describe("parseFoundryActor", () => {
  const s: MemberStats = parseFoundryActor(ACTOR);

  it("clase principal (originalClass) y nivel = suma de clases", () => {
    expect(s.clase).toBe("Blood Witch");
    expect(s.nivel).toBe(17);
  });

  it("AC desde formula numérica; HP es el máximo (no el value en vivo)", () => {
    expect(s.ac).toBe(17);
    expect(s.hpMax).toBe(191);
  });

  it("velocidad con unidades", () => {
    expect(s.speed).toBe("30 ft");
  });

  it("atributos con modificador calculado", () => {
    expect(s.abilities.cha).toEqual({ value: 20, mod: 5 });
    expect(s.abilities.str).toEqual({ value: 9, mod: -1 });
    expect(s.abilities.con.mod).toBe(4);
  });

  it("resistencias e inmunidades de condición traducidas al español", () => {
    expect(s.resistances).toEqual(["Frío", "Fuego", "Necrótico"]);
    expect(s.damageImmunities).toEqual([]);
    expect(s.conditionImmunities).toEqual(["Dormir"]);
  });

  it("sentidos: rangos > 0 + especial verbatim", () => {
    expect(s.senses).toEqual(["Visión en la oscuridad 60 ft", "Blood Sense 60"]);
  });

  it("idiomas traducidos", () => {
    expect(s.languages).toEqual(["Común", "Dracónico", "Abisal"]);
  });

  it("AC null cuando no hay flat ni formula numérica", () => {
    const noAc = parseFoundryActor({
      ...ACTOR,
      system: { ...ACTOR.system, attributes: { ...ACTOR.system.attributes, ac: { flat: null, calc: "default", formula: "" } } },
    });
    expect(noAc.ac).toBeNull();
  });

  it("no rompe con campos ausentes (degrada a vacío)", () => {
    const bare = parseFoundryActor({ name: "X", items: [], system: { attributes: {}, abilities: {}, traits: {}, details: {} } });
    expect(bare.resistances).toEqual([]);
    expect(bare.languages).toEqual([]);
    expect(bare.senses).toEqual([]);
    expect(bare.nivel).toBe(0);
    expect(bare.clase).toBe("");
  });
});
