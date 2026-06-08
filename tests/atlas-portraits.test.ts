import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATLAS_V2_KNOWN_PORTRAITS,
  ATLAS_V2_PORTRAIT_PLACEHOLDER,
  resolveAtlasPortrait,
} from "@/lib/atlas-portraits";

describe("atlas portrait resolver", () => {
  it("respeta imagenes explicitas del vault", () => {
    expect(resolveAtlasPortrait("borok", "/images/personajes/borok.webp")).toBe(
      "/images/personajes/borok.webp",
    );
  });

  it("asigna retratos conocidos cuando el vault no define imagen", () => {
    expect(resolveAtlasPortrait("mysha")).toBe(
      "/assets/atlas/portraits/mysha.png",
    );
    expect(resolveAtlasPortrait("borok")).toBe("/images/personajes/borok.png");
    expect(resolveAtlasPortrait("david-ilcard")).toBe(
      "/images/personajes/david-ilcard.png",
    );
    expect(resolveAtlasPortrait("rylen")).toBe("/images/personajes/rylen.png");
    expect(resolveAtlasPortrait("champi")).toBe("/images/personajes/champi.png");
    expect(resolveAtlasPortrait("selenne")).toBe(
      "/images/personajes/selenne.jpg",
    );
    expect(resolveAtlasPortrait("veltra")).toBe("/images/personajes/veltra.jpg");
    expect(resolveAtlasPortrait("anora")).toBe(
      "/images/personajes/annora.jpg",
    );
    expect(resolveAtlasPortrait("pat-pat")).toBe(
      "/images/personajes/pat.png",
    );
  });

  it("usa placeholder cuando no hay retrato conocido", () => {
    expect(resolveAtlasPortrait("nabish")).toBe(ATLAS_V2_PORTRAIT_PLACEHOLDER);
  });

  it("no apunta a archivos public inexistentes", () => {
    for (const src of Object.values(ATLAS_V2_KNOWN_PORTRAITS)) {
      const localPath = path.join(process.cwd(), "public", src.slice(1));
      expect(fs.existsSync(localPath), src).toBe(true);
    }
  });
});
