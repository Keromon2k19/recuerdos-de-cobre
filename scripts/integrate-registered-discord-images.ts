#!/usr/bin/env node
/**
 * Integra las imagenes registradas por audit-discord-images.ts.
 * Copia a public/images/<tipo>/ y actualiza el frontmatter image/imageAlt.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";

type Item = {
  source: string;
  tipo: "personajes" | "lugares" | "facciones";
  vaultFile: string;
  nombre: string;
};

const ITEMS: Item[] = [
  { source: "Annora.jpg", tipo: "personajes", vaultFile: "vault-mysha/personajes/annora.md", nombre: "Annora" },
  { source: "Darko.jpg", tipo: "personajes", vaultFile: "vault-mysha/personajes/darko.md", nombre: "Darko" },
  { source: "Los_Nefarios.jpg", tipo: "facciones", vaultFile: "vault-mysha/facciones/los-nefarios.md", nombre: "Los Nefarios" },
  { source: "Lucy.jpg", tipo: "personajes", vaultFile: "vault-mysha/personajes/lucy.md", nombre: "Lucy" },
  { source: "Margot.jpg", tipo: "personajes", vaultFile: "vault-mysha/personajes/margot.md", nombre: "Margot" },
  { source: "Miriel_Campbell.png", tipo: "personajes", vaultFile: "vault-mysha/personajes/miriel-campbell.md", nombre: "Miriel Campbell" },
  { source: "oraculo_encantado.png", tipo: "lugares", vaultFile: "vault-mysha/lugares/oraculo-encantado.md", nombre: "Oraculo Encantado" },
  { source: "Pablo.png", tipo: "personajes", vaultFile: "vault-mysha/personajes/pablo.md", nombre: "Pablo" },
  { source: "Pat.png", tipo: "personajes", vaultFile: "vault-mysha/personajes/pat.md", nombre: "Pat" },
  { source: "Pilar.jpg", tipo: "personajes", vaultFile: "vault-mysha/personajes/pilar.md", nombre: "Pilar" },
  { source: "Tyr.png", tipo: "facciones", vaultFile: "vault-mysha/facciones/tyr.md", nombre: "Tyr" },
];

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function main(): void {
  const projectDir = process.cwd();
  const discordDir = path.join(projectDir, "imagenes para la pagina", "discord");

  for (const item of ITEMS) {
    const source = path.join(discordDir, item.source);
    if (!fs.existsSync(source)) throw new Error(`No existe la imagen: ${source}`);

    const ext = path.extname(item.source).toLowerCase();
    const publicRel = `/images/${item.tipo}/${slugify(item.nombre)}${ext}`;
    const publicAbs = path.join(projectDir, "public", "images", item.tipo, `${slugify(item.nombre)}${ext}`);
    fs.mkdirSync(path.dirname(publicAbs), { recursive: true });
    fs.copyFileSync(source, publicAbs);

    const vaultAbs = path.join(projectDir, item.vaultFile);
    const parsed = matter(fs.readFileSync(vaultAbs, "utf-8"));
    if (typeof parsed.data.image !== "string" || parsed.data.image.trim() === "") {
      parsed.data.image = publicRel;
    }
    if (typeof parsed.data.imageAlt !== "string" || parsed.data.imageAlt.trim() === "") {
      parsed.data.imageAlt = item.nombre;
    }
    fs.writeFileSync(vaultAbs, matter.stringify(parsed.content.trim() + "\n", parsed.data), "utf-8");
    console.log(`${item.nombre}: ${publicRel}`);
  }

  console.log("Omitida por duplicado manual: Pablo-2.png");
}

main();
