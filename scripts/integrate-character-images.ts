#!/usr/bin/env node
/**
 * Integra el lote de imagenes de personajes que estan en la RAIZ de
 * "imagenes para la pagina/" hacia public/images/personajes/, actualizando el
 * frontmatter image/imageAlt del vault SOLO si esta vacio (no pisa nada).
 * Imprime las lineas listas para pegar en lib/atlas-portraits.ts.
 *
 * Lista revisada y aprobada por Joaquin. El Emperador NO es David: el alt
 * sale del campo `nombre` del frontmatter, nunca de un alias.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";

// [archivo fuente en la raiz, slug del .md en vault-mysha/personajes]
const ITEMS: [string, string][] = [
  // nombre identico al slug
  ["Aelrindel.png", "aerindel"],
  ["Aisha.jpg", "aisha"],
  ["Alexia_Vostrofer.jpg", "alexia-vostrofer"],
  ["El_Desconocido.jpg", "el-desconocido"],
  ["Galdur_Bloodblade.jpg", "galdur-bloodblade"],
  ["Luari.jpg", "luari"],
  ["Lucky.jpg", "lucky"],
  ["Magma.jpg", "magma"],
  ["Smooth.jpg", "smooth"],
  ["hansel.jpg", "hansel"],
  ["melissa.png", "melissa"],
  // nombre escrito distinto, resuelto contra el vault
  ["Anasstasia.jpg", "anastasia"],
  ["Maikol_Rudriberg.jpg", "michael-rudriberg"],
  ["Mizri_Mlezzir.jpg", "misri-mlesir"],
  ["Nendra_Morkaryn.jpg", "nendra"],
  ["Ormund_Velkarin.png", "ormund"],
  ["Thalissa_Thalassion.jpg", "talisa-talashon"],
  ["cat-ty.jpg", "katy"],
  ["THEEMPEROR.png", "el-emperador"],
  ["Eldrin_Van_Lurghden.jpg", "eldrin-van-lurgdhen"],
  // dioses (viven en personajes/ del vault)
  ["Tiamat.png", "tiamat"],
  ["vecna.png", "vecna"],
];

function main(): void {
  const projectDir = process.cwd();
  const srcDir = path.join(projectDir, "imagenes para la pagina");
  const portraitLines: string[] = [];
  let copied = 0;
  let fmSet = 0;
  let fmSkipped = 0;

  for (const [source, slug] of ITEMS) {
    const srcAbs = path.join(srcDir, source);
    if (!fs.existsSync(srcAbs)) throw new Error(`No existe la imagen fuente: ${srcAbs}`);

    const vaultAbs = path.join(projectDir, "vault-mysha", "personajes", `${slug}.md`);
    if (!fs.existsSync(vaultAbs)) throw new Error(`No existe la ficha del vault: ${vaultAbs}`);

    const ext = path.extname(source).toLowerCase();
    const publicRel = `/images/personajes/${slug}${ext}`;
    const publicAbs = path.join(projectDir, "public", "images", "personajes", `${slug}${ext}`);
    fs.mkdirSync(path.dirname(publicAbs), { recursive: true });
    fs.copyFileSync(srcAbs, publicAbs);
    copied++;

    const parsed = matter(fs.readFileSync(vaultAbs, "utf-8"));
    const nombre = typeof parsed.data.nombre === "string" && parsed.data.nombre.trim() ? parsed.data.nombre.trim() : slug;
    let touched = false;
    if (typeof parsed.data.image !== "string" || parsed.data.image.trim() === "") {
      parsed.data.image = publicRel;
      touched = true;
    }
    if (typeof parsed.data.imageAlt !== "string" || parsed.data.imageAlt.trim() === "") {
      parsed.data.imageAlt = nombre;
      touched = true;
    }
    if (touched) {
      fs.writeFileSync(vaultAbs, matter.stringify(parsed.content.trim() + "\n", parsed.data), "utf-8");
      fmSet++;
    } else {
      fmSkipped++;
    }

    portraitLines.push(`  "${slug}": "${publicRel}",`);
    console.log(`${touched ? "OK " : "FM-skip "} ${source.padEnd(34)} -> ${publicRel}`);
  }

  console.log(`\nResumen: ${copied} imagenes copiadas | frontmatter seteado en ${fmSet} | sin tocar ${fmSkipped}`);
  console.log(`\n--- Lineas para lib/atlas-portraits.ts (ATLAS_V2_KNOWN_PORTRAITS) ---`);
  console.log(portraitLines.join("\n"));
}

main();
