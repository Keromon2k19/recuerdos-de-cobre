import path from "node:path";
import fs from "node:fs";

export type AppConfig = {
  anthropicApiKey: string;
  vaultPath: string; // absoluto
};

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const key = env.ANTHROPIC_API_KEY?.trim();
  const vaultRaw = env.VAULT_PATH?.trim();

  if (!key) {
    throw new Error("ANTHROPIC_API_KEY no está definida en .env.local");
  }
  if (!vaultRaw) {
    throw new Error("VAULT_PATH no está definida en .env.local");
  }

  const vaultPath = path.resolve(vaultRaw);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`VAULT_PATH no existe en disco: ${vaultPath}`);
  }

  return { anthropicApiKey: key, vaultPath };
}
