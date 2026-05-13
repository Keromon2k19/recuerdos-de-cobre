import { describe, it, expect } from "vitest";
import { loadConfig } from "@/lib/config";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

describe("loadConfig", () => {
  it("rechaza ANTHROPIC_API_KEY ausente", () => {
    expect(() =>
      loadConfig({ ANTHROPIC_API_KEY: "", VAULT_PATH: "/tmp" })
    ).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("rechaza VAULT_PATH ausente", () => {
    expect(() =>
      loadConfig({ ANTHROPIC_API_KEY: "sk-x", VAULT_PATH: "" })
    ).toThrow(/VAULT_PATH/);
  });

  it("acepta valores válidos y resuelve a ruta absoluta", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mysha-cfg-"));
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
