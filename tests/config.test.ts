import { describe, it, expect } from "vitest";
import { loadConfig, loadAnthropicKey } from "@/lib/config";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

describe("loadConfig", () => {
  it("permite ANTHROPIC_API_KEY ausente (legacy, no usada en el pipeline)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recuerdos-cfg-"));
    const cfg = loadConfig({ ANTHROPIC_API_KEY: "", VAULT_PATH: dir });
    expect(cfg.anthropicApiKey).toBeUndefined();
    fs.rmSync(dir, { recursive: true });
  });

  it("rechaza VAULT_PATH ausente", () => {
    expect(() =>
      loadConfig({ ANTHROPIC_API_KEY: "sk-x", VAULT_PATH: "" })
    ).toThrow(/VAULT_PATH/);
  });

  it("acepta valores válidos y resuelve a ruta absoluta", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "recuerdos-cfg-"));
    const cfg = loadConfig({ ANTHROPIC_API_KEY: "sk-x", VAULT_PATH: dir });
    expect(cfg.anthropicApiKey).toBe("sk-x");
    expect(path.isAbsolute(cfg.vaultPath)).toBe(true);
    fs.rmSync(dir, { recursive: true });
  });

  it("rechaza VAULT_PATH inexistente", () => {
    expect(() =>
      loadConfig({
        ANTHROPIC_API_KEY: "sk-x",
        VAULT_PATH: "/ruta/que/no/existe/123abc",
      })
    ).toThrow(/no existe/);
  });
});

describe("loadAnthropicKey", () => {
  it("rechaza ANTHROPIC_API_KEY ausente", () => {
    expect(() => loadAnthropicKey({ ANTHROPIC_API_KEY: "" })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("devuelve la key cuando está definida", () => {
    expect(loadAnthropicKey({ ANTHROPIC_API_KEY: "sk-x" })).toBe("sk-x");
  });
});
