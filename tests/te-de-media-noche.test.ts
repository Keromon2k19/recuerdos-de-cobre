// tests/te-de-media-noche.test.ts
import { describe, it, expect } from "vitest";
import type { AtlasEntityDetail } from "@/lib/atlas-content";
import { TDMN_MEMBERS, TDMN_CUT_LINKS } from "@/data/atlas/te-de-media-noche";
import { buildConstellation } from "@/lib/te-de-media-noche";
import { TDMN_STATS } from "@/data/atlas/tdmn-stats";

function fakeDetail(partial: Partial<AtlasEntityDetail> & { slug: string }): AtlasEntityDetail {
  return {
    kind: "personaje",
    name: partial.slug,
    aliases: [],
    description: "",
    appearances: [],
    meta: [],
    relations: [],
    sections: [],
    ...partial,
  } as AtlasEntityDetail;
}

// resolver de mentira: mapea nombres conocidos a paths del atlas
const PATHS: Record<string, string> = {
  Mysha: "/personajes/mysha",
  Layra: "/personajes/layra",
  Narcissa: "/personajes/narcissa",
  Borok: "/personajes/borok",
  Champi: "/personajes/champi",
  "Coven Rojo": "/facciones/coven-rojo",
  "Hermandad de Cobre": "/facciones/hermandad-de-cobre",
  "Oráculo Encantado": "/lugares/oraculo-encantado",
};
const resolve = (name: string) => PATHS[name] ?? null;

describe("config TDMN", () => {
  it("tiene 10 miembros con slugs únicos y borok separado", () => {
    expect(TDMN_MEMBERS).toHaveLength(10);
    expect(new Set(TDMN_MEMBERS.map((m) => m.slug)).size).toBe(10);
    expect(TDMN_MEMBERS.find((m) => m.slug === "borok")?.estado).toBe("separado");
    expect(TDMN_CUT_LINKS).toContainEqual(["borok", "mysha"]);
  });
});

describe("buildConstellation", () => {
  it("devuelve los 10 miembros en el orden de la config", () => {
    const data = buildConstellation(new Map(), resolve);
    expect(data.members.map((m) => m.slug)).toEqual(TDMN_MEMBERS.map((m) => m.slug));
  });

  it("usa nombre/placeholder de fallback cuando no hay detail del vault", () => {
    const data = buildConstellation(new Map(), resolve);
    const pilar = data.members.find((m) => m.slug === "pilar")!;
    expect(pilar.name).toBe("Pilar");
    expect(pilar.imageSrc).toBeTruthy();
  });

  it("prefiere datos del vault cuando hay detail", () => {
    const details = new Map([
      ["mysha", fakeDetail({ slug: "mysha", name: "Mysha", aliases: ["Selenne", "Veltra"], description: "Bruja de sangre.", appearances: [1, 2, 3] })],
    ]);
    const data = buildConstellation(details, resolve);
    const mysha = data.members.find((m) => m.slug === "mysha")!;
    expect(mysha.aliases).toEqual(["Selenne", "Veltra"]);
    expect(mysha.bio).toBe("Bruja de sangre.");
    expect(mysha.episodes).toBe(3);
  });

  it("limpia la biografía removiendo prefijos de rol redundantes y corrigiendo truncados", () => {
    const details = new Map([
      ["mysha", fakeDetail({
        slug: "mysha",
        name: "Mysha",
        description: "Mysha es una de las PJ de la campaña. Joven bruja de sangre que busca respuestas...",
      })],
      ["layra", fakeDetail({
        slug: "layra",
        name: "Layra",
        description: "Layra es un NPC de la campaña, una elfa que controla los engranajes; ella es muy astuta.",
      })],
    ]);
    const data = buildConstellation(details, resolve);
    const mysha = data.members.find((m) => m.slug === "mysha")!;
    const layra = data.members.find((m) => m.slug === "layra")!;

    expect(mysha.bio).toBe("Joven bruja de sangre que busca respuestas");
    expect(layra.bio).toBe("Una elfa que controla los engranajes; ella es muy astuta.");
  });

  it("arma edges entre miembros, deduplicados por par y sin borok", () => {
    const details = new Map([
      ["mysha", fakeDetail({ slug: "mysha", relations: [
        { name: "Layra", detail: "amiga", episode: 5 },
        { name: "Borok", detail: "ex compañero", episode: 2 },
      ] })],
      ["layra", fakeDetail({ slug: "layra", relations: [
        { name: "Mysha", detail: "amiga", episode: 9 }, // mismo par → dedupe
      ] })],
    ]);
    const data = buildConstellation(details, resolve);
    expect(data.edges).toEqual([{ a: "layra", b: "mysha" }]); // par ordenado, 1 sola vez, sin borok
    expect(data.cutEdges).toEqual([["borok", "mysha"]]);
  });

  it("satélites: solo personajes y facciones, orden por episodio desc, tope 8", () => {
    const rels = [
      { name: "Coven Rojo", detail: "miembro", episode: 3 },
      { name: "Oráculo Encantado", detail: "visitó", episode: 9 }, // lugar → fuera
      { name: "Champi", detail: "familiar", episode: 8 },
      ...Array.from({ length: 9 }, (_, i) => ({ name: "Narcissa", detail: `v${i}`, episode: i })), // mismo target → 1 satélite
    ];
    const details = new Map([["mysha", fakeDetail({ slug: "mysha", relations: rels })]]);
    const data = buildConstellation(details, resolve);
    const sats = data.satsByMember["mysha"];
    expect(sats.length).toBeLessThanOrEqual(8);
    expect(sats.map((s) => s.kind)).not.toContain("lugar");
    expect(sats[0].episode).toBeGreaterThanOrEqual(sats[sats.length - 1].episode ?? 0);
    expect(sats.find((s) => s.slug === "coven-rojo")?.kind).toBe("faccion");
    expect(sats.find((s) => s.slug === "champi")?.kind).toBe("personaje");
    expect(sats.find((s) => s.slug === "narcissa")?.episode).toBe(8);
  });

  it("satélites que no resuelven a entidad del atlas quedan fuera", () => {
    const details = new Map([["mysha", fakeDetail({ slug: "mysha", relations: [
      { name: "Un Desconocido Sin Ficha", detail: "habló", episode: 1 },
    ] })]]);
    const data = buildConstellation(details, resolve);
    expect(data.satsByMember["mysha"]).toEqual([]);
  });
});

describe("buildConstellation — ficha técnica e identidad", () => {
  it("adjunta stats por slug y null si no hay", () => {
    const data = buildConstellation(new Map(), resolve, { mysha: TDMN_STATS.mysha });
    const mysha = data.members.find((m) => m.slug === "mysha")!;
    const pilar = data.members.find((m) => m.slug === "pilar")!;
    expect(mysha.stats?.clase).toBe("Blood Witch");
    expect(pilar.stats).toBeNull();
  });

  it("expone la identidad curada de la config", () => {
    const data = buildConstellation(new Map(), resolve);
    const mysha = data.members.find((m) => m.slug === "mysha")!;
    expect(mysha.raza).toBe("Humana");
    expect(mysha.edad).toBe("16");
    expect(mysha.altura).toBe("1,65 m");
  });

  it("stats por defecto vacío no rompe las 7 tests previas (3 args opcional)", () => {
    const data = buildConstellation(new Map(), resolve);
    expect(data.members).toHaveLength(10);
    expect(data.members.every((m) => m.stats === null)).toBe(true);
  });
});
