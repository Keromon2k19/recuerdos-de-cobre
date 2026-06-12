import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { slugify } from "../lib/slugify";

const VAULT = path.resolve(__dirname, "..", "vault-recuerdos-de-cobre");

type MergeRule = {
  from: string;
  to: string;
  rawSlug?: boolean;
};

type RenameRule = {
  from: string;
  to: string;
  newName: string;
};

const MERGES: MergeRule[] = [
  { from: "personajes/campbell.md", to: "personajes/miriel-campbell.md" },
  { from: "personajes/senor-johnson.md", to: "personajes/carl-johnson.md" },
  { from: "personajes/cautivo-con-bozal.md", to: "personajes/randy.md" },
  { from: "personajes/criaturas-de-barro.md", to: "personajes/criaturas-de-barro-y-piedra.md" },
  { from: "personajes/cyranus.md", to: "personajes/siranus.md" },
  { from: "personajes/marco.md", to: "personajes/darko.md" },
  { from: "personajes/dragon-rojo.md", to: "personajes/devorador-de-lava.md" },
  { from: "personajes/dracelas.md", to: "personajes/dracelas-luminis.md" },
  { from: "personajes/familiar-de-la-matriarca.md", to: "personajes/familiar-de-la-matriarca-del-coven-rojo.md" },
  { from: "personajes/zorro-blanco.md", to: "personajes/familiar-de-la-matriarca-del-coven-rojo.md" },
  { from: "personajes/lor-arieth.md", to: "personajes/lor-arieth-mournleaf.md" },
  { from: "personajes/meri.md", to: "personajes/mary.md" },
  { from: "personajes/masa-de-carne-del-ultimo-bastion.md", to: "personajes/masa-de-carne-de-hellgrim.md" },
  { from: "personajes/matriarca-del-coven-rojo.md", to: "personajes/sina.md" },
  { from: "personajes/padre-de-tina.md", to: "personajes/nestor.md" },
  { from: "personajes/nim-iglazer.md", to: "personajes/nim.md" },
  { from: "personajes/nym.md", to: "personajes/nim.md" },
  { from: "personajes/orion.md", to: "personajes/orion-volderminer.md" },
  { from: "personajes/zar.md", to: "personajes/sar.md" },
  { from: "personajes/zhaar.md", to: "personajes/sar.md" },
  { from: "personajes/tali.md", to: "personajes/talisa-talashon.md" },
  { from: "personajes/teodora.md", to: "personajes/teodora-malister.md" },
  { from: "facciones/vecna.md", to: "personajes/vecna.md" },
  { from: "worldbuilding/vecna.md", to: "personajes/vecna.md" },
  { from: "worldbuilding/wendigo.md", to: "personajes/wendigo.md" },
  { from: "worldbuilding/creador-de-glaciares.md", to: "personajes/creador-de-glaciares.md" },
  { from: "worldbuilding/mortoris-spiritcrown.md", to: "personajes/mortoris-spiritcrown.md" },
  { from: "worldbuilding/bandido-verde.md", to: "personajes/bandido-verde.md" },
  { from: "facciones/mystra.md", to: "personajes/mystra.md" },
  { from: "facciones/gnolls.md", to: "personajes/gnolls.md" },
  { from: "worldbuilding/gnolls.md", to: "personajes/gnolls.md" },
  { from: "lugares/hermandad-de-arcanis.md", to: "facciones/hermandad-de-arcanis.md" },
  { from: "worldbuilding/hermandad-de-arcanis.md", to: "facciones/hermandad-de-arcanis.md" },
  { from: "lugares/renegados.md", to: "facciones/renegados.md" },
  { from: "worldbuilding/siranus.md", to: "personajes/siranus.md" },
  { from: "worldbuilding/dama-del-desierto.md", to: "personajes/dama-del-desierto.md" },
  { from: "facciones/tyr.md", to: "personajes/tyr.md" },
  { from: "worldbuilding/carcel-viviente.md", to: "lugares/carcel-viviente.md" },
  { from: "facciones/gleetjeris.md", to: "lugares/gleetjeris.md" },
  { from: "facciones/metropolis-de-cobre.md", to: "lugares/metropolis-de-cobre.md" },
  { from: "facciones/nutriopolis.md", to: "lugares/nutriopolis.md" },
  { from: "worldbuilding/nutriopolis.md", to: "lugares/nutriopolis.md" },
  { from: "facciones/aldea-sheedra.md", to: "lugares/aldea-sheedra.md" },
  { from: "worldbuilding/ejercito-de-la-libertad.md", to: "facciones/ejercito-de-la-libertad.md" },
  { from: "worldbuilding/halcones-grises.md", to: "facciones/halcones-grises.md" },
  { from: "worldbuilding/invierno-perpetuo.md", to: "objetos/invierno-perpetuo.md" },
  { from: "worldbuilding/bosque-de-las-memorias.md", to: "lugares/bosque-de-las-memorias.md" },
  { from: "worldbuilding/chetnazad.md", to: "lugares/chetnazad.md" },
  { from: "worldbuilding/onuti.md", to: "facciones/onuti.md" },
  { from: "worldbuilding/tiamat.md", to: "personajes/tiamat.md" },
  { from: "worldbuilding/underdark.md", to: "lugares/underdark.md" },
  { from: "worldbuilding/arkala.md", to: "lugares/arkala.md" },
  { from: "worldbuilding/turmalina.md", to: "objetos/turmalina.md" },
  { from: "worldbuilding/portal-al-plano-de-fuego.md", to: "lugares/portal-al-plano-de-fuego.md" },
  { from: "lugares/carta-de-nabish.md", to: "objetos/carta-de-nabish.md" },
  { from: "lugares/libro-de-mysha.md", to: "objetos/libro-de-mysha.md" },
  { from: "worldbuilding/carta-de-la-fortuna.md", to: "objetos/carta-de-la-fortuna.md" },
  { from: "worldbuilding/dagas-de-layra.md", to: "objetos/dagas-de-layra.md" },
  { from: "worldbuilding/estudio-de-narcissa.md", to: "lugares/estudio-de-narcissa.md" },
  { from: "worldbuilding/fraz-urbluu.md", to: "personajes/fraz-urbluu.md" },
  { from: "personajes/mind-flayers-del-glimmersea.md", to: "facciones/mind-flayers-del-glimmersea.md" },
  { from: "facciones/caminantes-etereos.md", to: "personajes/caminantes-etereos.md" },
  { from: "worldbuilding/caminantes-etereos.md", to: "personajes/caminantes-etereos.md" },
  { from: "lugares/coven-verde.md", to: "facciones/coven-verde.md" },
  { from: "facciones/el-caliz-de-las-sirenas.md", to: "lugares/el-caliz-de-las-sirenas.md" },
  { from: "lugares/pecera.md", to: "objetos/pecera.md" },
  { from: "facciones/plumas-doradas.md", to: "lugares/plumas-doradas.md" },
  { from: "objetos/chancho.md", to: "personajes/chancho.md" },
  { from: "personajes/draconidos-de-gleetjeris.md", to: "facciones/draconidos-de-gleetjeris.md" },
  { from: "worldbuilding/familiares-corrompidos.md", to: "facciones/familiares-corrompidos.md" },
  { from: "personajes/hermanas-del-coven-rojo.md", to: "facciones/hermanas-del-coven-rojo.md" },
  { from: "personajes/merfolks.md", to: "facciones/merfolks.md" },
  { from: "personajes/myconids.md", to: "facciones/myconids.md" },
  { from: "worldbuilding/myconids.md", to: "facciones/myconids.md" },
  { from: "worldbuilding/flor-de-la-convergencia.md", to: "objetos/flor-de-la-convergencia.md" },
  { from: "worldbuilding/flor-espejo.md", to: "objetos/flor-espejo.md" },
  { from: "worldbuilding/gusanos-traductores.md", to: "objetos/gusanos-traductores.md" },
  { from: "worldbuilding/flores-del-ultimo-lamento.md", to: "objetos/flores-del-ultimo-lamento.md" },
  { from: "lugares/semilla-del-ultimo-roble.md", to: "objetos/semilla-del-ultimo-roble.md" },
  { from: "eventos/flor-del-eco-desviado.md", to: "objetos/flor-del-eco-desviado.md" },
  { from: "eventos/dedo-esqueletico-de-borok.md", to: "objetos/dedo-esqueletico-de-borok.md" },
  { from: "facciones/fragata-dorada.md", to: "lugares/fragata-dorada.md" },
  { from: "worldbuilding/sombra-de-siltris.md", to: "lugares/sombra-de-siltris.md" },
  { from: "worldbuilding/liquido-del-infinito.md", to: "objetos/liquido-del-infinito.md" },
  { from: "worldbuilding/simbolo-de-vecna.md", to: "objetos/simbolo-de-vecna.md" },
  { from: "worldbuilding/sigil.md", to: "lugares/sigil.md" },
  { from: "worldbuilding/feywild.md", to: "lugares/feywild.md" },
  { from: "worldbuilding/plano-de-fuego.md", to: "lugares/plano-de-fuego.md" },
  { from: "personajes/merrows.md", to: "facciones/merrows.md" },
  { from: "facciones/ninos-del-barrio-rojo.md", to: "personajes/ninos-del-barrio-rojo.md" },
  { from: "facciones/voz-de-yggdrasil.md", to: "personajes/voz-de-yggdrasil.md" },
  { from: "facciones/santuario-de-los-libres.md", to: "lugares/santuario-de-los-libres.md" },
  { from: "worldbuilding/santuario-de-los-libres.md", to: "lugares/santuario-de-los-libres.md" },
  { from: "facciones/reloj-de-arena.md", to: "lugares/reloj-de-arena.md" },
  { from: "facciones/caldero-gris.md", to: "lugares/caldero-gris.md" },
  { from: "lugares/cobre-negro.md", to: "facciones/cobre-negro.md" },
  { from: "facciones/druidia.md", to: "personajes/druidia.md" },
  { from: "lugares/druidia.md", to: "personajes/druidia.md" },
  { from: "facciones/aldinak.md", to: "personajes/aldinak.md" },
  { from: "lugares/lefaye.md", to: "lugares/reino-de-lefaye.md", rawSlug: false },
  { from: "worldbuilding/abonis-rojos.md", to: "objetos/abonis-rojos.md" },
  { from: "worldbuilding/acheron.md", to: "lugares/acheron.md" },
  { from: "worldbuilding/baile-de-las-penas.md", to: "eventos/baile-de-las-penas.md" },
  { from: "worldbuilding/biblioteca-de-piedra-perdida.md", to: "lugares/biblioteca-de-piedra-perdida.md" },
  { from: "worldbuilding/bosque-petrificado.md", to: "lugares/bosque-petrificado.md" },
  { from: "worldbuilding/carta-de-teletransporte.md", to: "objetos/carta-de-teletransporte.md" },
  { from: "worldbuilding/ciudad-de-las-puertas.md", to: "lugares/ciudad-de-las-puertas.md" },
  { from: "worldbuilding/corazon-de-mystra.md", to: "lugares/corazon-de-mystra.md" },
  { from: "worldbuilding/dama-de-hierro.md", to: "personajes/dama-de-hierro.md" },
  { from: "worldbuilding/dominio-de-nabish.md", to: "lugares/dominio-de-nabish.md" },
  { from: "worldbuilding/doppelgangers.md", to: "facciones/doppelgangers.md" },
  { from: "worldbuilding/elementales-de-roca.md", to: "personajes/elementales-de-roca.md" },
  { from: "worldbuilding/elixires-de-io.md", to: "objetos/elixires-de-io.md" },
  { from: "worldbuilding/far-realm.md", to: "lugares/far-realm.md" },
  { from: "worldbuilding/festival-del-comercio.md", to: "lugares/festival-del-comercio.md" },
  { from: "worldbuilding/fragmentos-de-divinidad.md", to: "objetos/fragmentos-de-divinidad.md" },
  { from: "worldbuilding/funeral-rebirth.md", to: "eventos/funeral-rebirth.md" },
  { from: "worldbuilding/hermanas-de-yin-y-yang.md", to: "lugares/hermanas-de-yin-y-yang.md" },
  { from: "worldbuilding/infierno-de-erina.md", to: "lugares/infierno-de-erina.md" },
  { from: "worldbuilding/isla-de-las-estaciones.md", to: "lugares/isla-de-las-estaciones.md" },
  { from: "worldbuilding/leyenda-del-carronero.md", to: "eventos/leyenda-del-carronero.md" },
  { from: "worldbuilding/maldicion-del-hambre.md", to: "objetos/maldicion-del-hambre.md" },
  { from: "worldbuilding/manada-de-los-rompehuesos.md", to: "facciones/manada-de-los-rompehuesos.md" },
  { from: "worldbuilding/millegroth.md", to: "lugares/millegroth.md" },
  { from: "worldbuilding/mujer-del-dolor.md", to: "personajes/mujer-del-dolor.md" },
  { from: "worldbuilding/munecas-de-mysha.md", to: "objetos/munecas-de-mysha.md" },
  { from: "worldbuilding/nueva-gran-aristocracia.md", to: "facciones/nueva-gran-aristocracia.md" },
  { from: "worldbuilding/pazunia.md", to: "lugares/pazunia.md" },
  { from: "worldbuilding/plano-abisal.md", to: "lugares/plano-abisal.md" },
  { from: "worldbuilding/plano-astral.md", to: "lugares/plano-astral.md" },
  { from: "worldbuilding/plano-espiritual.md", to: "lugares/plano-espiritual.md" },
  { from: "worldbuilding/plano-etereo.md", to: "lugares/plano-etereo.md" },
  { from: "worldbuilding/rio-de-la-poesia.md", to: "lugares/rio-de-la-poesia.md" },
  { from: "worldbuilding/runas-de-mystra.md", to: "objetos/runas-de-mystra.md" },
  { from: "worldbuilding/salon-prohibido.md", to: "lugares/salon-prohibido.md" },
  { from: "worldbuilding/santuario-funerario-de-narcissa.md", to: "lugares/santuario-funerario-de-narcissa.md" },
  { from: "worldbuilding/velada-de-las-mascaras.md", to: "lugares/velada-de-las-mascaras.md" },
  { from: "worldbuilding/vidrio-ferrico.md", to: "objetos/vidrio-ferrico.md" },
  { from: "eventos/carta-de-randy.md", to: "objetos/carta-de-randy.md" },
  { from: "eventos/marca-de-proteccion-drow.md", to: "objetos/marca-de-proteccion-drow.md" },
  { from: "eventos/nota-de-nim.md", to: "objetos/nota-de-nim.md" },
  { from: "eventos/ocho-marcas-del-poder.md", to: "objetos/ocho-marcas-del-poder.md" },
  { from: "eventos/pajaro-de-hielo-de-layra.md", to: "objetos/pajaro-de-hielo-de-layra.md" },
  { from: "objetos/cementerio-de-luz.md", to: "lugares/cementerio-de-luz.md" },
  { from: "objetos/el-diablillo.md", to: "lugares/el-diablillo.md" },
  { from: "lugares/tortuga-magica.md", to: "objetos/tortuga-magica.md" },
  { from: "objetos/puerta-dorada-del-santuario.md", to: "lugares/puerta-dorada-del-santuario.md" },
  { from: "lugares/administracion-del-santuario.md", to: "facciones/administracion-del-santuario.md" },
  { from: "facciones/aldea-de-arena.md", to: "lugares/aldea-de-arena.md" },
  { from: "facciones/aldea-de-zitzl.md", to: "lugares/aldea-de-zitzl.md" },
  { from: "facciones/cobre-en-rojo.md", to: "lugares/cobre-en-rojo.md" },
  { from: "facciones/colonia-mind-flayer.md", to: "lugares/colonia-mind-flayer.md" },
  { from: "facciones/dominio-de-ambrosia.md", to: "lugares/dominio-de-ambrosia.md" },
  { from: "facciones/forja-de-lava.md", to: "lugares/forja-de-lava.md" },
  { from: "lugares/gremio.md", to: "facciones/gremio.md" },
  { from: "lugares/hermandad-de-plumas-doradas.md", to: "facciones/hermandad-de-plumas-doradas.md" },
  { from: "facciones/iglesia-de-druidia.md", to: "lugares/iglesia-de-druidia.md" },
  { from: "facciones/jardin.md", to: "lugares/jardin.md" },
  { from: "facciones/jardin-de-los-deseos.md", to: "lugares/jardin-de-los-deseos.md" },
  { from: "facciones/mas-naturalidad.md", to: "lugares/mas-naturalidad.md" },
  { from: "facciones/nueva-nutriopolis.md", to: "lugares/nueva-nutriopolis.md" },
  { from: "facciones/oraculo-encantado.md", to: "lugares/oraculo-encantado.md" },
  { from: "facciones/reino-de-los-renegados.md", to: "lugares/reino-de-los-renegados.md" },
  { from: "facciones/sombra-de-siltris.md", to: "lugares/sombra-de-siltris.md" },
];

const RENAMES: RenameRule[] = [
  {
    from: "lugares/hermandad-de-cobre.md",
    to: "lugares/sede-de-la-hermandad-de-cobre.md",
    newName: "Sede de la Hermandad de Cobre",
  },
  {
    from: "lugares/monarquia-de-lefaye.md",
    to: "lugares/reino-de-lefaye.md",
    newName: "Reino de Lefaye",
  },
  {
    from: "facciones/pueblo-de-layra.md",
    to: "facciones/draconidos-del-pueblo-de-layra.md",
    newName: "Draconidos del Pueblo de Layra",
  },
  {
    from: "lugares/aldinak.md",
    to: "lugares/ciudad-de-aldinak.md",
    newName: "Ciudad de Aldinak",
  },
];

const DRY = !process.argv.includes("--apply");

function vaultPath(rel: string): string {
  const abs = path.resolve(VAULT, rel);
  if (!abs.startsWith(VAULT + path.sep)) {
    throw new Error(`Path outside vault: ${rel}`);
  }
  return abs;
}

function exists(rel: string): boolean {
  return fs.existsSync(vaultPath(rel));
}

function read(rel: string) {
  const abs = vaultPath(rel);
  if (!fs.existsSync(abs)) throw new Error(`Missing file: ${rel}`);
  return matter(fs.readFileSync(abs, "utf8"));
}

function write(rel: string, parsed: matter.GrayMatterFile<string>) {
  if (DRY) return;
  fs.writeFileSync(vaultPath(rel), matter.stringify(parsed.content.trimEnd() + "\n", parsed.data), "utf8");
}

function remove(rel: string) {
  if (DRY) return;
  fs.unlinkSync(vaultPath(rel));
}

function renameFile(from: string, to: string) {
  if (fs.existsSync(vaultPath(to))) throw new Error(`Rename target already exists: ${to}`);
  if (DRY) return;
  fs.renameSync(vaultPath(from), vaultPath(to));
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function mergeUnique<T>(a: T[], b: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of [...a, ...b]) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function folderLabel(rel: string): string {
  return rel.replace(/\\/g, "/").replace(/\.md$/i, "");
}

function appendImportedSection(
  canonicalBody: string,
  fromRel: string,
  importedBody: string
): string {
  const trimmed = importedBody
    .trim()
    .replace(/^## Menciones por episodio\s*/m, "")
    .trim();
  if (!trimmed) return canonicalBody;
  if (canonicalBody.includes(trimmed)) return canonicalBody;
  return [
    canonicalBody.trimEnd(),
    "",
    `## Menciones importadas de ${folderLabel(fromRel)}`,
    "",
    trimmed,
    "",
  ].join("\n");
}

function mergeFile(rule: MergeRule): boolean {
  if (!exists(rule.from)) return false;
  if (!exists(rule.to)) throw new Error(`Missing canonical file: ${rule.to}`);

  const from = read(rule.from);
  const to = read(rule.to);

  to.data.apariciones = mergeUnique(
    asArray(to.data.apariciones).map(Number).filter(Boolean),
    asArray(from.data.apariciones).map(Number).filter(Boolean)
  ).sort((a, b) => a - b);

  to.data.alias = mergeUnique(
    asArray(to.data.alias).filter(Boolean),
    [
      String(from.data.nombre ?? "").trim(),
      ...asArray(from.data.alias).filter(Boolean).map(String),
    ].filter(Boolean)
  );

  to.data.relaciones = mergeUnique(
    asArray(to.data.relaciones).filter(Boolean),
    asArray(from.data.relaciones).filter(Boolean)
  );

  to.content = appendImportedSection(to.content, rule.from, from.content);
  write(rule.to, to);
  remove(rule.from);
  return true;
}

function renameEntity(rule: RenameRule): boolean {
  if (!exists(rule.from)) return false;
  if (exists(rule.to)) throw new Error(`Rename target already exists: ${rule.to}`);

  const parsed = read(rule.from);
  const oldName = String(parsed.data.nombre ?? "").trim();
  parsed.data.nombre = rule.newName;
  parsed.data.alias = mergeUnique(asArray(parsed.data.alias).filter(Boolean), [
    oldName,
  ].filter(Boolean));
  write(rule.from, parsed);
  renameFile(rule.from, rule.to);
  return true;
}

function walkMd(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(abs));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(abs);
  }
  return out;
}

type Rewrite = {
  fromPath: string;
  fromSlug: string;
  toPath: string;
  rawSlug: boolean;
};

function pathTarget(rel: string): string {
  return rel.replace(/\\/g, "/").replace(/\.md$/i, "");
}

function rewriteLinks(rewrites: Rewrite[]) {
  const byPath = new Map(rewrites.map((r) => [r.fromPath.toLowerCase(), r.toPath]));
  const mergedBySlug = new Map<string, string>();
  for (const r of rewrites) {
    if (!r.rawSlug) continue;
    if (!mergedBySlug.has(r.fromSlug)) mergedBySlug.set(r.fromSlug, r.toPath);
  }

  const wiki = /\[\[([^\]\|#]+)(#[^\]\|]+)?(?:\|([^\]]+))?\]\]/g;
  let filesTouched = 0;
  let replacements = 0;

  for (const abs of walkMd(VAULT)) {
    const oldText = fs.readFileSync(abs, "utf8");
    const newText = oldText.replace(wiki, (full, rawTarget, anchor = "", label) => {
      const target = String(rawTarget).trim().replace(/\\/g, "/").replace(/\.md$/i, "");
      const pathHit = byPath.get(target.toLowerCase());
      const slug = slugify(target);
      const slugHit = target.includes("/") ? null : mergedBySlug.get(slug);
      const next = pathHit ?? slugHit;
      if (!next) return full;
      replacements++;
      return `[[${next}${anchor}|${label ?? rawTarget}]]`;
    });
    if (newText !== oldText) {
      filesTouched++;
      if (!DRY) fs.writeFileSync(abs, newText, "utf8");
    }
  }

  return { filesTouched, replacements };
}

function main() {
  const rewrites: Rewrite[] = [];
  let mergesApplied = 0;
  let renamesApplied = 0;

  for (const rule of MERGES) {
    rewrites.push({
      fromPath: pathTarget(rule.from),
      fromSlug: path.basename(rule.from, ".md"),
      toPath: pathTarget(rule.to),
      rawSlug: rule.rawSlug ?? true,
    });
  }
  for (const rule of RENAMES) {
    rewrites.push({
      fromPath: pathTarget(rule.from),
      fromSlug: path.basename(rule.from, ".md"),
      toPath: pathTarget(rule.to),
      rawSlug: false,
    });
  }

  if (!DRY) {
    for (const rule of MERGES) {
      if (mergeFile(rule)) mergesApplied++;
    }
    for (const rule of RENAMES) {
      if (renameEntity(rule)) renamesApplied++;
    }
  } else {
    mergesApplied = MERGES.filter((rule) => exists(rule.from)).length;
    renamesApplied = RENAMES.filter((rule) => exists(rule.from)).length;
  }

  const linkResult = rewriteLinks(rewrites);
  console.log({
    mode: DRY ? "dry-run" : "apply",
    merges: mergesApplied,
    renames: renamesApplied,
    ...linkResult,
  });
}

main();
