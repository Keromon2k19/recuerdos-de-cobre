#!/usr/bin/env node
/**
 * Descarga imagenes de un canal concreto de Discord usando un bot.
 *
 * Requisitos del bot en ese canal:
 * - View Channel
 * - Read Message History
 *
 * Uso:
 *   npx tsx scripts/download-discord-images.ts
 *   npx tsx scripts/download-discord-images.ts --channel 123 --out "imagenes para la pagina/discord"
 *   npx tsx scripts/download-discord-images.ts --after 2026-01-01 --before 2026-05-21
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

type DiscordAttachment = {
  id: string;
  filename: string;
  content_type?: string;
  url: string;
  proxy_url?: string;
  size?: number;
};

type DiscordEmbed = {
  type?: string;
  url?: string;
  image?: { url?: string };
  thumbnail?: { url?: string };
};

type DiscordMessage = {
  id: string;
  channel_id: string;
  author?: { id: string; username?: string; global_name?: string | null };
  content?: string;
  timestamp: string;
  attachments?: DiscordAttachment[];
  embeds?: DiscordEmbed[];
  sticker_items?: Array<{ id: string; name?: string; format_type?: number }>;
};

type ManifestEntry = {
  messageId: string;
  attachmentId: string;
  url: string;
  filename: string;
  savedAs: string;
  author: string;
  timestamp: string;
  sha256: string;
  bytes: number;
};

type Manifest = {
  channelId: string;
  updatedAt: string;
  files: ManifestEntry[];
};

type Args = {
  channel?: string;
  out?: string;
  after?: string;
  before?: string;
  maxMessages?: number;
  message?: string;
  debug: boolean;
  preserveNames: boolean;
  includeEmbeds: boolean;
  dryRun: boolean;
  help: boolean;
};

const DISCORD_API = "https://discord.com/api/v10";
const IMAGE_EXTENSIONS = new Set([
  ".apng",
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = { debug: false, preserveNames: false, includeEmbeds: false, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--channel") args.channel = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--after") args.after = argv[++i];
    else if (a === "--before") args.before = argv[++i];
    else if (a === "--max-messages") args.maxMessages = Number(argv[++i]);
    else if (a === "--message") args.message = argv[++i];
    else if (a === "--debug") args.debug = true;
    else if (a === "--preserve-names") args.preserveNames = true;
    else if (a === "--include-embeds") args.includeEmbeds = true;
    else if (a === "--dry-run") args.dryRun = true;
    else throw new Error(`Argumento desconocido: ${a}`);
  }
  return args;
}

function printHelp(): void {
  console.log(`Descarga imagenes de un canal de Discord.

Variables en .env.local:
  DISCORD_BOT_TOKEN=token_del_bot
  DISCORD_CHANNEL_ID=id_del_canal
  DISCORD_IMAGE_OUT_DIR=imagenes para la pagina/discord   # opcional

Opciones:
  --channel <id>        Sobrescribe DISCORD_CHANNEL_ID
  --out <carpeta>       Carpeta de salida
  --after <fecha>       Solo mensajes desde esta fecha, inclusive. Ej: 2026-01-01
  --before <fecha>      Solo mensajes antes de esta fecha, inclusive. Ej: 2026-05-21
  --max-messages <n>    Limite de mensajes a revisar
  --message <id>        Inspecciona un mensaje concreto y termina
  --include-embeds      Tambien descarga imagenes embebidas
  --preserve-names      Guarda attachments con el nombre original de Discord
  --debug               Muestra conteos por mensaje para diagnostico
  --dry-run             Lista lo que descargaria sin escribir imagenes
  --help                Muestra esta ayuda

Ejemplo:
  npx tsx scripts/download-discord-images.ts --channel 123456789 --out "imagenes para la pagina/discord"
`);
}

function parseDate(value: string | undefined, endOfDay = false): number | null {
  if (!value) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : value;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) throw new Error(`Fecha invalida: ${value}`);
  return ms;
}

function isImageAttachment(a: DiscordAttachment): boolean {
  if (a.content_type?.toLowerCase().startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(path.extname(a.filename).toLowerCase());
}

function extensionFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext) ? ext : ".jpg";
  } catch {
    return ".jpg";
  }
}

function safePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function safeFilename(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^\.+$/, "image")
    .trim()
    .slice(0, 160) || "image";
}

function outputName(message: DiscordMessage, id: string, filename: string): string {
  const date = message.timestamp.replace(/[:.]/g, "-").replace("T", "_").replace("Z", "");
  const author = safePart(message.author?.global_name || message.author?.username || "unknown");
  const base = safePart(path.basename(filename, path.extname(filename))) || "image";
  const ext = path.extname(filename) || extensionFromUrl(filename);
  return `${date}_${author}_${message.id}_${id}_${base}${ext}`;
}

function uniqueOutputName(outDir: string, usedNames: Set<string>, filename: string): string {
  const safe = safeFilename(filename);
  const ext = path.extname(safe);
  const base = path.basename(safe, ext) || "image";
  let candidate = `${base}${ext}`;
  let n = 2;

  while (usedNames.has(candidate.toLowerCase()) || fs.existsSync(path.join(outDir, candidate))) {
    candidate = `${base}-${n}${ext}`;
    n++;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function summarizeMessage(message: DiscordMessage): void {
  console.log(`Mensaje ${message.id} (${message.timestamp})`);
  console.log(`  canal: ${message.channel_id}`);
  console.log(`  autor: ${message.author?.global_name || message.author?.username || "unknown"}`);
  console.log(`  texto: ${(message.content ?? "").replace(/\s+/g, " ").slice(0, 120) || "(vacio)"}`);
  console.log(`  attachments: ${message.attachments?.length ?? 0}`);
  for (const attachment of message.attachments ?? []) {
    console.log(
      `    - ${attachment.id} ${attachment.filename} ${attachment.content_type ?? "(sin content_type)"} ${attachment.size ?? 0} bytes`,
    );
  }
  console.log(`  embeds: ${message.embeds?.length ?? 0}`);
  for (const [i, embed] of (message.embeds ?? []).entries()) {
    console.log(
      `    - #${i} type=${embed.type ?? "(sin type)"} url=${embed.url ?? "(sin url)"} image=${embed.image?.url ?? "(sin image)"} thumbnail=${embed.thumbnail?.url ?? "(sin thumbnail)"}`,
    );
  }
  console.log(`  stickers: ${message.sticker_items?.length ?? 0}`);
  for (const sticker of message.sticker_items ?? []) {
    console.log(`    - ${sticker.id} ${sticker.name ?? "(sin nombre)"} format=${sticker.format_type ?? "?"}`);
  }
}

function readManifest(outDir: string, channelId: string): Manifest {
  const manifestPath = path.join(outDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { channelId, updatedAt: new Date().toISOString(), files: [] };
  }
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Manifest;
  parsed.files ??= [];
  return parsed;
}

function writeManifest(outDir: string, manifest: Manifest): void {
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

async function discordGet<T>(token: string, endpoint: string): Promise<T> {
  while (true) {
    const res = await fetch(`${DISCORD_API}${endpoint}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (res.status === 429) {
      const body = (await res.json()) as { retry_after?: number };
      const waitMs = Math.ceil((body.retry_after ?? 1) * 1000) + 250;
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord API ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No pude descargar ${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main(): Promise<void> {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const channelId = args.channel ?? process.env.DISCORD_CHANNEL_ID?.trim();
  const outDir = path.resolve(args.out ?? process.env.DISCORD_IMAGE_OUT_DIR ?? "imagenes para la pagina/discord");
  if (!token) throw new Error("Falta DISCORD_BOT_TOKEN en .env.local");
  if (!channelId) throw new Error("Falta DISCORD_CHANNEL_ID en .env.local o --channel");
  if (args.maxMessages !== undefined && (!Number.isFinite(args.maxMessages) || args.maxMessages <= 0)) {
    throw new Error("--max-messages debe ser un numero positivo");
  }
  if (args.message) {
    const message = await discordGet<DiscordMessage>(token, `/channels/${channelId}/messages/${args.message}`);
    summarizeMessage(message);
    return;
  }

  const after = parseDate(args.after);
  const before = parseDate(args.before, true);
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = readManifest(outDir, channelId);
  const seen = new Set(manifest.files.map((f) => `${f.messageId}:${f.attachmentId}`));
  const usedNames = new Set(manifest.files.map((f) => f.savedAs.toLowerCase()));

  let beforeId: string | undefined;
  let scanned = 0;
  let found = 0;
  let saved = 0;
  let skipped = 0;
  let stop = false;

  while (!stop) {
    const limit = 100;
    const qs = new URLSearchParams({ limit: String(limit) });
    if (beforeId) qs.set("before", beforeId);
    const messages = await discordGet<DiscordMessage[]>(token, `/channels/${channelId}/messages?${qs}`);
    if (messages.length === 0) break;

    for (const message of messages) {
      scanned++;
      if (args.debug) {
        console.log(
          `debug ${message.id} ${message.timestamp} attachments=${message.attachments?.length ?? 0} embeds=${message.embeds?.length ?? 0} stickers=${message.sticker_items?.length ?? 0}`,
        );
      }
      const t = Date.parse(message.timestamp);
      if (before !== null && t > before) {
        beforeId = message.id;
        continue;
      }
      if (after !== null && t < after) {
        stop = true;
        break;
      }
      if (args.maxMessages && scanned > args.maxMessages) {
        stop = true;
        break;
      }

      const attachments = (message.attachments ?? []).filter(isImageAttachment);
      const embedAttachments: DiscordAttachment[] = args.includeEmbeds
        ? (message.embeds ?? [])
            .flatMap((e, i) => [e.image?.url, e.thumbnail?.url].filter((u): u is string => Boolean(u)).map((url, j) => ({
              id: `embed-${i}-${j}`,
              filename: `embed-${i}-${j}${extensionFromUrl(url)}`,
              url,
            })))
        : [];

      for (const item of [...attachments, ...embedAttachments]) {
        found++;
        const key = `${message.id}:${item.id}`;
        if (seen.has(key)) {
          skipped++;
          continue;
        }

        const savedAs = args.preserveNames
          ? uniqueOutputName(outDir, usedNames, item.filename)
          : outputName(message, item.id, item.filename);
        const target = path.join(outDir, savedAs);
        console.log(`${args.dryRun ? "would save" : "save"} ${savedAs}`);
        if (args.dryRun) continue;

        const bytes = await download(item.url);
        fs.writeFileSync(target, bytes);
        manifest.files.push({
          messageId: message.id,
          attachmentId: item.id,
          url: item.url,
          filename: item.filename,
          savedAs,
          author: message.author?.global_name || message.author?.username || "unknown",
          timestamp: message.timestamp,
          sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
          bytes: bytes.length,
        });
        seen.add(key);
        saved++;
      }
    }

    beforeId = messages[messages.length - 1]?.id;
    if (messages.length < limit) break;
  }

  if (!args.dryRun) writeManifest(outDir, manifest);
  console.log(`Listo. Mensajes revisados: ${scanned}. Imagenes encontradas: ${found}. Nuevas: ${saved}. Ya estaban: ${skipped}.`);
  console.log(`Carpeta: ${outDir}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
