import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATLAS_V2_KNOWN_PORTRAITS,
  ATLAS_V2_PORTRAIT_PLACEHOLDER,
  resolveAtlasV2Portrait,
} from "@/lib/atlas-v2-portraits";

describe("atlas-v2 portrait resolver", () => {
  it("respeta imagenes explicitas del vault", () => {
    expect(resolveAtlasV2Portrait("borok", "/images/personajes/borok.webp")).toBe(
      "/images/personajes/borok.webp",
    );
  });

  it("asigna retratos conocidos cuando el vault no define imagen", () => {
    expect(resolveAtlasV2Portrait("mysha")).toBe(
      "/assets/atlas-v2/portraits/mysha.png",
    );
    expect(resolveAtlasV2Portrait("borok")).toBe("/images/personajes/borok.png");
    expect(resolveAtlasV2Portrait("david-ilcard")).toBe(
      "/images/personajes/david-ilcard.png",
    );
    expect(resolveAtlasV2Portrait("rylen")).toBe("/images/personajes/rylen.png");
    expect(resolveAtlasV2Portrait("champi")).toBe("/images/personajes/champi.png");
    expect(resolveAtlasV2Portrait("selenne")).toBe(
      "/images/personajes/selenne.jpg",
    );
    expect(resolveAtlasV2Portrait("veltra")).toBe("/images/personajes/veltra.jpg");
    expect(resolveAtlasV2Portrait("anora")).toBe(
      "/images/personajes/annora.jpg",
    );
    expect(resolveAtlasV2Portrait("pat-pat")).toBe(
      "/images/personajes/pat.png",
    );
  });

  it("usa placeholder cuando no hay retrato conocido", () => {
    expect(resolveAtlasV2Portrait("nabish")).toBe(ATLAS_V2_PORTRAIT_PLACEHOLDER);
  });

  it("no apunta a archivos public inexistentes", () => {
    for (const src of Object.values(ATLAS_V2_KNOWN_PORTRAITS)) {
      const localPath = path.join(process.cwd(), "public", src.slice(1));
      expect(fs.existsSync(localPath), src).toBe(true);
    }
  });
});
