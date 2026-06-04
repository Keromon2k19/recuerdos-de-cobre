import { describe, expect, it } from "vitest";
import {
  LEGACY_PUBLIC_REDIRECTS,
  V2_ROUTES,
  isV2PublicHref,
} from "@/lib/atlas-v2-routes";

describe("atlas-v2-routes", () => {
  it("define la arquitectura publica final sin Archivos", () => {
    expect(V2_ROUTES).toMatchObject({
      home: "/v2",
      capitulos: "/v2/capitulos",
      personajes: "/v2/personajes",
      facciones: "/v2/facciones",
      lugares: "/v2/lugares",
      mapa: "/v2/mapa",
      dioses: "/v2/dioses",
      objetos: "/v2/objetos",
      misterios: "/v2/misterios",
      mundo: "/v2/mundo",
      buscar: "/v2/buscar",
    });
    expect("archivos" in V2_ROUTES).toBe(false);
  });

  it("redirige las rutas publicas anteriores directamente a V2", () => {
    expect(LEGACY_PUBLIC_REDIRECTS["/"]).toBe("/v2");
    expect(LEGACY_PUBLIC_REDIRECTS["/cronicas/:num"]).toBe(
      "/v2/capitulos/:num",
    );
    expect(LEGACY_PUBLIC_REDIRECTS["/personajes/:slug"]).toBe(
      "/v2/personajes/:slug",
    );
    expect(LEGACY_PUBLIC_REDIRECTS["/worldbuilding/:slug"]).toBe(
      "/v2/mundo/:slug",
    );
    expect(LEGACY_PUBLIC_REDIRECTS["/entidades/objeto/:slug"]).toBe(
      "/v2/objetos/:slug",
    );
  });

  it("reconoce enlaces publicos V2 y excluye rutas publicas V1 o locales", () => {
    expect(isV2PublicHref("/v2")).toBe(true);
    expect(isV2PublicHref("/v2/personajes/mysha")).toBe(true);
    expect(isV2PublicHref("/personajes/mysha")).toBe(false);
    expect(isV2PublicHref("/procesar")).toBe(false);
    expect(isV2PublicHref("https://example.com/v2")).toBe(false);
  });
});
