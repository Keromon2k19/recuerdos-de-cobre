import { describe, expect, it } from "vitest";
import {
  LEGACY_PUBLIC_REDIRECTS,
  ATLAS_ROUTES,
  isPublicHref,
} from "@/lib/atlas-routes";

describe("atlas-routes", () => {
  it("define la arquitectura publica final sin Archivos", () => {
    expect(ATLAS_ROUTES).toMatchObject({
      home: "/",
      capitulos: "/capitulos",
      personajes: "/personajes",
      facciones: "/facciones",
      lugares: "/lugares",
      mapa: "/mapa",
      dioses: "/dioses",
      objetos: "/objetos",
      misterios: "/misterios",
      mundo: "/mundo",
      buscar: "/buscar",
    });
    expect("archivos" in ATLAS_ROUTES).toBe(false);
  });

  it("redirige las rutas publicas anteriores directamente a Atlas", () => {
    expect(LEGACY_PUBLIC_REDIRECTS["/v2"]).toBe("/");
    expect(LEGACY_PUBLIC_REDIRECTS["/v2/capitulos/:num"]).toBe(
      "/capitulos/:num",
    );
    expect(LEGACY_PUBLIC_REDIRECTS["/v2/personajes/:slug"]).toBe(
      "/personajes/:slug",
    );
    expect(LEGACY_PUBLIC_REDIRECTS["/cronicas/:num"]).toBe(
      "/capitulos/:num",
    );
    expect(LEGACY_PUBLIC_REDIRECTS["/entidades/objeto/:slug"]).toBe(
      "/objetos/:slug",
    );
  });

  it("reconoce enlaces publicos y excluye rutas locales", () => {
    expect(isPublicHref("/")).toBe(true);
    expect(isPublicHref("/personajes/mysha")).toBe(true);
    expect(isPublicHref("/capitulos/82")).toBe(true);
    expect(isPublicHref("/procesar")).toBe(false);
    expect(isPublicHref("https://example.com/")).toBe(false);
  });
});
