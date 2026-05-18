#!/usr/bin/env node
/**
 * Mysha — Seeder de entidades canónicas desde el glosario del DM.
 *
 * Lee la información canónica hardcodeada acá (derivada de vault-mysha/_glossary.md)
 * y crea/actualiza los archivos en vault-mysha/personajes/, lugares/, etc.
 *
 * Idempotente:
 *  - Si la entidad NO existe → crea (origen: "glosario")
 *  - Si la entidad existe con origen "glosario" → reemplaza solo la sección Canon
 *  - Si la entidad existe sin origen "glosario" (creada por extracción) → agrega
 *    sección Canon al principio del body sin tocar apariciones/menciones extraídas
 *
 * Uso:
 *   npx tsx scripts/seed-from-glossary.ts
 *   npx tsx scripts/seed-from-glossary.ts --dry-run   (no escribe, solo lista)
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { EntityType } from "../lib/types";
import { ENTITY_FOLDERS } from "../lib/types";
import { slugify } from "../lib/slugify";

// ─── Tipo del dato seed ───────────────────────────────────────────────────

type SeedEntity = {
  tipo: EntityType;
  nombre: string;
  alias?: string[];
  /** Descripción canónica (1-3 oraciones). Se renderiza dentro de "## Canon (del DM)". */
  canon: string;
};

// ─── Taxonomía estructurada (para filtros / agrupación en la UI) ──────────

type Taxonomy = {
  /** Solo personajes: rol del personaje en la historia */
  rol?: "PJ" | "NPC" | "familiar" | "antagonista";
  /** Solo PJs: nombre del jugador */
  jugador?: string;
  /** Personajes: facciones a las que pertenece. Facciones/lugares: facciones relacionadas */
  facciones?: string[];
  /** Región principal donde se sitúa. Para sub-lugares: lugar padre */
  region?: string;
  /** Categoría dentro del tipo. Lugar: ciudad/aldea/edificio/...; Faccion: politica/coven/...; Worldbuilding: dios_principal/concepto/...; Objeto: artefacto/carta_tarot/... */
  categoria?: string;
  /** Eventos: acto narrativo en que ocurre */
  acto?: number;
};

/**
 * Map de taxonomía por nombre canónico. Se mergea con los SEED entries al
 * construir el archivo. Se mantiene aparte para que SEED quede legible y la
 * estructura tabular acá sea fácil de auditar.
 */
const TAXONOMY: Record<string, Taxonomy> = {
  // ─── PJs ──────────────────────────────────────────────────────────────
  "Mysha":       { rol: "PJ", jugador: "Kero",                                   facciones: ["Coven Rojo", "Hermandad de Cobre"],   region: "Metrópolis de Cobre" },
  "Borok":       { rol: "PJ", jugador: "Mati",                                   facciones: ["Hermandad de Cobre", "Vecna"],         region: "Metrópolis de Cobre" },
  "Layra":       { rol: "PJ", jugador: "Layla",                                  facciones: ["Hermandad de Cobre"],                   region: "Montañas de Frío Eterno" },
  "Narcissa":    { rol: "PJ", jugador: "Mica",                                   facciones: ["Hermandad de Cobre"],                   region: "Metrópolis de Cobre" },
  "David Ilcard":{ rol: "PJ", jugador: "Lucho",                                  facciones: ["Hermandad de Cobre", "Tyr"],            region: "Metrópolis de Cobre" },
  "Io Campbell": { rol: "PJ", jugador: "Mile / Kuzu / Sis / Nico",               facciones: ["Hermandad de Cobre"],                   region: "Metrópolis de Cobre" },
  "Eryon":       { rol: "PJ", jugador: "Tiago" },

  // ─── Familiares ───────────────────────────────────────────────────────
  "Champi":      { rol: "familiar", facciones: ["Mysha"] },
  "Blacrani":    { rol: "familiar", facciones: ["Narcissa"] },

  // ─── NPCs por región / facción ────────────────────────────────────────
  "Annora":               { rol: "NPC", facciones: ["Hermandad de Cobre", "La Gran Aristocracia"], region: "Metrópolis de Cobre" },
  "Margarita":            { rol: "NPC", facciones: ["Hermandad de Cobre"],   region: "Metrópolis de Cobre" },
  "Lord Faxius":          { rol: "NPC", facciones: ["Plumas Doradas"],        region: "Metrópolis de Cobre" },
  "Clara":                { rol: "NPC", facciones: ["Plumas Doradas"],        region: "Metrópolis de Cobre" },
  "Celeste":              { rol: "NPC", facciones: ["Hermandad de Cobre"],   region: "Metrópolis de Cobre" },
  "Carl Jhonson":         { rol: "NPC",                                       region: "Lorenza" },
  "PatPat":               { rol: "NPC", facciones: ["Hermandad de Cobre"],   region: "Lorenza" },
  "Pilar":                { rol: "NPC", facciones: ["Hermandad de Cobre"],   region: "Lorenza" },
  "Sargento Gastón Chersey":{ rol: "NPC", facciones: ["Guardia de Lorenza"], region: "Lorenza" },
  "El Profesor":          { rol: "NPC", facciones: ["La Gran Aristocracia"],region: "Metrópolis de Cobre" },
  "Vladimir Clarte":      { rol: "NPC", facciones: ["La Gran Aristocracia"],region: "Metrópolis de Cobre" },
  "Darko":                { rol: "NPC",                                       region: "Metrópolis de Cobre" },
  "Mironov":              { rol: "NPC",                                       region: "Metrópolis de Cobre" },
  "Puck":                 { rol: "NPC",                                       region: "Metrópolis de Cobre" },
  "Zaros Creighton":      { rol: "antagonista", facciones: ["Vecna"],         region: "Khelgrim" },
  "Zhaar":                { rol: "antagonista",                               region: "Desierto de los Espejos" },
  "Sitzil":               { rol: "antagonista",                               region: "Desierto de los Espejos" },
  "Freda":                { rol: "NPC",                                       region: "Sanctuario de los Libres" },
  "Larren":               { rol: "NPC",                                       region: "Sanctuario de los Libres" },
  "Nym":                  { rol: "NPC",                                       region: "Sanctuario de los Libres" },
  "Nori":                 { rol: "NPC", facciones: ["Los Soñadores"],         region: "Sanctuario de los Libres" },
  "Aria":                 { rol: "antagonista", facciones: ["Los Soñadores", "Vecna"], region: "Sanctuario de los Libres" },
  "Toshi":                { rol: "NPC",                                       region: "Sanctuario de los Libres" },
  "Raylen":               { rol: "NPC", facciones: ["Los Nefarios", "Luk"],   region: "Sanctuario de los Libres" },
  "Amari Zaled":          { rol: "NPC", facciones: ["Ejército de la Libertad"], region: "Sanctuario de los Libres" },
  "El Corruptor":         { rol: "antagonista", facciones: ["Los Nefarios"], region: "Sanctuario de los Libres" },
  "Capitán Fóster":       { rol: "NPC",                                       region: "Mar del Leviatán" },
  "Luk":                  { rol: "antagonista",                               region: "Plano demoníaco" },
  "Apolo Iorxan":         { rol: "NPC", facciones: ["La Dinastía de las Alas Metálicas"] },
  "Orion Bolderminer":    { rol: "NPC", facciones: ["Imperio de los Grandes"] },
  "Firguc Alasol":        { rol: "NPC", facciones: ["Imperio de los Grandes"] },
  "Armola Caihana":       { rol: "NPC", facciones: ["Los Renegados"] },
  "Saphira Nyerovik":     { rol: "NPC", facciones: ["Los Renegados"] },
  "La Voz de Aldinach":   { rol: "NPC", facciones: ["Los Renegados"] },
  "Mortoris Spiritcrown": { rol: "antagonista", facciones: ["Lanceros del Alba"] },
  "Wendigo":              { rol: "antagonista",                               region: "Plano Etéreo" },
  "La Dama del Dolor":    { rol: "antagonista",                               region: "Sigil" },
  "Demogorgon":           { rol: "antagonista",                               region: "Plano demoníaco" },

  // ─── Facciones ────────────────────────────────────────────────────────
  "Hermandad de Cobre":            { categoria: "gremio",    region: "Metrópolis de Cobre" },
  "La Gran Aristocracia":          { categoria: "politica",  region: "Metrópolis de Cobre" },
  "La Monarquía de Lefaye":        { categoria: "politica" },
  "La Dinastía de las Alas Metálicas": { categoria: "politica" },
  "Los Renegados":                 { categoria: "politica" },
  "Imperio de los Grandes":        { categoria: "politica" },
  "Aldea de Guerreros Espirituales": { categoria: "aldea" },
  "Aldea de Movedores de Montañas": { categoria: "aldea" },
  "Manada de los Rompehuesos":     { categoria: "aldea" },
  "Aldeas de los Molinos":         { categoria: "aldea" },
  "Los Soñadores":                 { categoria: "gremio",    region: "Sanctuario de los Libres" },
  "Los Nefarios":                  { categoria: "banda",     region: "Sanctuario de los Libres" },
  "Lanceros del Alba":             { categoria: "militar" },
  "Ejército de la Libertad":       { categoria: "militar",   region: "Sanctuario de los Libres" },
  "Ejército de Eyra":              { categoria: "militar" },
  "Coven Rojo":                    { categoria: "coven" },
  "Coven Rosa":                    { categoria: "coven" },
  "Coven Negro":                   { categoria: "coven" },
  "Coven Blanco":                  { categoria: "coven" },
  "Coven Verde":                   { categoria: "coven" },
  "Té de Medianoche":              { categoria: "evento" },

  // ─── Lugares ──────────────────────────────────────────────────────────
  "Eyra":                       { categoria: "continente" },
  "Metrópolis de Cobre":        { categoria: "ciudad",      region: "Eyra" },
  "Plumas Doradas":             { categoria: "edificio",    region: "Metrópolis de Cobre" },
  "Lorenza":                    { categoria: "aldea",       region: "Eyra" },
  "Khelgrim":                   { categoria: "subterraneo", region: "Lorenza" },
  "Arkala":                     { categoria: "ciudad",      region: "Eyra" },
  "Desierto de los Espejos":    { categoria: "geografia",   region: "Eyra" },
  "Sanctuario de los Libres":   { categoria: "ciudad",      region: "Eyra" },
  "Mar del Leviatán":           { categoria: "geografia",   region: "Eyra" },
  "Montañas de Frío Eterno":    { categoria: "geografia",   region: "Eyra" },
  "Sigil":                      { categoria: "ciudad",      region: "Otros planos" },
  "Feywilds":                   { categoria: "plano",       region: "Otros planos" },

  // ─── Worldbuilding ────────────────────────────────────────────────────
  "Mystra":      { categoria: "dios_principal" },
  "Vecna":       { categoria: "dios_principal" },
  "Locky":       { categoria: "dios_principal" },
  "Tyr":         { categoria: "dios_principal" },
  "Leira":       { categoria: "dios_principal" },
  "Druidia":     { categoria: "dios_principal" },
  "Myrkul":      { categoria: "dios_principal" },
  "Raven Queen": { categoria: "dios_principal" },
  "Luzne":       { categoria: "dios_principal" },
  "Selune":      { categoria: "dios_principal" },
  "Orcus":       { categoria: "dios_secundario" },
  "Umberlee":    { categoria: "dios_secundario" },
  "Talos":       { categoria: "dios_secundario" },
  "Tymora":      { categoria: "dios_secundario" },
  "Bahamut":     { categoria: "dios_secundario" },
  "Tiamat":      { categoria: "dios_secundario" },
  "Moradín":     { categoria: "dios_secundario" },
  "Lefaye":      { categoria: "dios_secundario" },
  "Erina":       { categoria: "dios_secundario" },
  "El Dios de Dioses":           { categoria: "entidad_planar" },
  "Cuerpo, Alma y Espíritu":     { categoria: "concepto" },
  "Plano Etéreo":                { categoria: "concepto" },
  "Magia Caótica":               { categoria: "magia" },
  "Runas Arcanas":               { categoria: "magia" },
  "Ritual de Ascensión":         { categoria: "ritual" },
  "Solsticios":                  { categoria: "concepto" },

  // ─── Objetos ──────────────────────────────────────────────────────────
  "Wheel of Fortune":            { categoria: "carta_tarot" },
  "Libro del Ritual de Ascensión": { categoria: "libro" },
  "Artefacto disipador":         { categoria: "artefacto" },
};

// ─── Datos canónicos (extraídos de vault-mysha/_glossary.md) ───────────────

const SEED: SeedEntity[] = [
  // ─── Personajes jugadores (PJs) ──────────────────────────────────────────
  {
    tipo: "personaje",
    nombre: "Mysha",
    alias: ["Selenne", "Veltra", "Milla", "Misha"],
    canon:
      "Protagonista, bruja de sangre. Jugada por Kero. Empieza la campaña como miembro del **Coven Rojo**; más adelante en la trama se vuelve miembro del **Coven Rosa**. Tiene **3 personalidades** que conviven en la misma persona: Mysha (principal), Selenne y Veltra. Si en transcripts/resúmenes aparece como 'Milla' o 'Misha', es Whisper transcribiendo mal su nombre. Champi es su búho familiar.",
  },
  {
    tipo: "personaje",
    nombre: "Borok",
    canon:
      "PJ semi-orco. Jugado por Mati. Tiene visiones. Al final del Acto IV sella un pacto con Vecna y se convierte en su campeón. Busca a su maestro orco Puck en la Metrópolis de Cobre.",
  },
  {
    tipo: "personaje",
    nombre: "Layra",
    canon:
      "PJ dracónica. Jugada por Layla (no confundir: Layla = jugadora, Layra = personaje). Su hogar es atacado por un dragón rojo que derrite el hielo eterno. Da un discurso en el Torneo de las Almas para concientizar sobre esto. Hija de un dragón de Feywilds.",
  },
  {
    tipo: "personaje",
    nombre: "Narcissa",
    canon:
      "PJ boticaria. Jugada por Mica. Bajita, pelo oscuro largo, ojos violetas. Coexiste con arañas (su mascota es Blacrani, una tarántula negra). Tiene una puerta mágica que muestra un estudio cambiante. En el Desierto de los Espejos usa una carta del tarot y casi es asesinada por La Dama del Dolor (reina de Sigil).",
  },
  {
    tipo: "personaje",
    nombre: "David Ilcard",
    canon:
      "PJ asimar defensor de Tyr. Jugado por Lucho. Monje, coqueto, con nunchakus ocultos. Piel oscura, ojos grisáceos, pecas doradas que brillan. En el Acto IV casi pierde su divinidad como aasimar al participar en matar un ángel de Tyr.",
  },
  {
    tipo: "personaje",
    nombre: "Io Campbell",
    alias: ["Io"],
    canon:
      "PJ. Jugada por Mile/Kuzu/Sis/Nico (varios nicknames del mismo jugador). 'Io' es nombre propio (NO el pronombre 'yo'). En el Acto III se revela su verdadera naturaleza: una criatura férrica. Lleva un paquete que le encargaron entregar pero le fue robado antes de empezar.",
  },
  {
    tipo: "personaje",
    nombre: "Eryon",
    canon:
      "PJ futuro. Jugado por Tiago. Importante en arcos posteriores. Todavía no aparece en los episodios procesados.",
  },

  // ─── Familiares con nombre ───────────────────────────────────────────────
  {
    tipo: "personaje",
    nombre: "Champi",
    canon:
      "Búho familiar de Mysha. Es un personaje aunque sea animal — viaja con ella y participa en escenas.",
  },
  {
    tipo: "personaje",
    nombre: "Blacrani",
    canon:
      "Tarántula negra, mascota de Narcissa. Coexiste con otras arañas en el rincón de la Hermandad de Cobre donde Narcissa trabaja.",
  },

  // ─── NPCs principales — Hermandad de Cobre / Metrópolis ──────────────────
  {
    tipo: "personaje",
    nombre: "Annora",
    canon:
      "Líder de la Hermandad de Cobre. Humana con parche negro en el ojo derecho, cabello rojo rubí, collar con un rubí. Buscada por la ciudad con una recompensa de 150.000 monedas de oro. Representa a la Gran Aristocracia y a la Hermandad de Cobre. Tiene poder político importante aunque no es concejala oficial.",
  },
  {
    tipo: "personaje",
    nombre: "Margarita",
    alias: ["la Doctora"],
    canon:
      "'La Doctora' de la Hermandad de Cobre. Mujer con un collar de escorpión y viales. Boticaria experta, usa magia para recolectar sangre en viales para el ritual del pacto.",
  },
  {
    tipo: "personaje",
    nombre: "Lord Faxius",
    canon:
      "Animador y anfitrión del casino Plumas Doradas en la Metrópolis de Cobre. Humano aristocrático con bigote distintivo y peinado llamativo. Sospechosamente cortés — ofrece la 'bebida azulada' drogada que noquea al grupo en el Acto I.",
  },
  {
    tipo: "personaje",
    nombre: "Clara",
    canon:
      "Camarera joven del casino Plumas Doradas. Piel clara, pecas, cabello naranja recogido. Sirve a Mysha y Borok en su primera noche en la Metrópolis.",
  },
  {
    tipo: "personaje",
    nombre: "Celeste",
    canon:
      "Mujer alta y esbelta, vocera de Annora. Guía al grupo desde la habitación de Annora hasta la taberna de la Hermandad después del pacto de sangre.",
  },
  {
    tipo: "personaje",
    nombre: "Carl Jhonson",
    alias: ["Carl Johnson"],
    canon:
      "Pueblerino de la aldea Lorenza. La Hermandad firma un contrato con él para defender Lorenza de los gnolls que la atacan. Es el cliente del primer trabajo del grupo.",
  },
  {
    tipo: "personaje",
    nombre: "PatPat",
    canon:
      "Acompañante del grupo. Junto a Pilar, viaja con ellos a Lorenza. Más adelante confirman el vínculo entre Darko, Mironov y el líder ocultista de Vecna al verlos juntos en la excavación.",
  },
  {
    tipo: "personaje",
    nombre: "Pilar",
    canon:
      "Acompañante del grupo. Junto a PatPat, viaja con ellos a Lorenza. Confirma el vínculo entre Darko, Mironov y el líder ocultista de Vecna.",
  },
  {
    tipo: "personaje",
    nombre: "Sargento Gastón Chersey",
    canon:
      "Sargento Primero. Guardia del que el grupo escapa en Lorenza para meterse en la excavación que lleva a Khelgrim.",
  },
  {
    tipo: "personaje",
    nombre: "El Profesor",
    canon:
      "Concejal de Innovación y Tecnología de la Metrópolis. Reemplazó al anterior Concejal de Justicia y Administración de Bienes. Investiga el cuerpo maldito de Zaros Creighton que el grupo le deja al final del Acto I. Hay tramas que sugieren que está siendo vinculado al líder ocultista de Vecna a través de Darko y Mironov.",
  },
  {
    tipo: "personaje",
    nombre: "Vladimir Clarte",
    canon:
      "Concejal de Salud, Educación y Trabajo de la Gran Aristocracia (Metrópolis de Cobre).",
  },
  {
    tipo: "personaje",
    nombre: "Darko",
    canon:
      "Personaje involucrado en una trama política turbia. Se encarga de vincular a Mironov con el líder ocultista de Vecna (el que se escapó en la Metrópolis en el Acto I). Pilar y PatPat lo ven con ellos en la excavación.",
  },
  {
    tipo: "personaje",
    nombre: "Mironov",
    canon:
      "Personaje involucrado en la trama política con Darko. Está siendo vinculado al líder ocultista de Vecna por Darko.",
  },
  {
    tipo: "personaje",
    nombre: "Puck",
    canon:
      "Maestro orco de Borok. Borok lo busca en la Metrópolis de Cobre. Solo mencionado por ahora.",
  },

  // ─── NPCs — Khelgrim (Acto I) ────────────────────────────────────────────
  {
    tipo: "personaje",
    nombre: "Zaros Creighton",
    canon:
      "Antiguo campeón de Vecna, líder duergar en Khelgrim. Encontrado por el grupo como un 'pedazo de carne alguna vez humano', maldito a no morir — su alma no puede abandonar su cuerpo. Sostiene la carta legendaria 'Wheel of Fortune'. El grupo se lleva su cuerpo a la Metrópolis para que El Profesor lo investigue.",
  },

  // ─── NPCs — Acto II (Desierto de los Espejos / Arkala) ──────────────────
  {
    tipo: "personaje",
    nombre: "Zhaar",
    canon:
      "Humano (aparente) que monta escorpiones gigantes. Guía al grupo a través del Desierto de los Espejos. Lee las cartas del tarot al grupo dándoles advertencias. Al final del cruce se revela su verdadera forma de Doppleganger. Tenía 2 cartas más de la fortuna.",
  },
  {
    tipo: "personaje",
    nombre: "Sitzil",
    canon:
      "Yuan-Ti. Pide ayuda al grupo para salvar a su pueblo. El grupo descubre que los traiciona y la matan. Después ven cómo gran parte de los Yuan-Ti son asesinados por una de las 3 subrazas.",
  },

  // ─── NPCs — Acto III (Sanctuario de los Libres) ─────────────────────────
  {
    tipo: "personaje",
    nombre: "Freda",
    canon:
      "Granjera en la salida del Sanctuario de los Libres. Junto a Larren, vende a Nym (su esclavo) al grupo.",
  },
  {
    tipo: "personaje",
    nombre: "Larren",
    canon:
      "Granjero en la salida del Sanctuario de los Libres. Junto a Freda, vende a Nym al grupo.",
  },
  {
    tipo: "personaje",
    nombre: "Nym",
    canon:
      "Esclavo liberado por el grupo en la salida del Sanctuario. Buscaba a su hermana. Asesinado junto a su hermana en la venganza de Los Nefarios en el Acto III.",
  },
  {
    tipo: "personaje",
    nombre: "Nori",
    canon:
      "Gran amigo de Borok. Lidera 'Los Soñadores', su anterior grupo de aventureros. Aria (warlock con pacto con Vecna) está en este grupo.",
  },
  {
    tipo: "personaje",
    nombre: "Aria",
    canon:
      "Warlock con pacto con Vecna. Miembro de Los Soñadores (grupo de Nori). En el Acto IV traiciona al grupo y roba el tesoro buscado. La matan, y al sellar ese momento Borok firma su propio pacto con Vecna convirtiéndose en su campeón.",
  },
  {
    tipo: "personaje",
    nombre: "Toshi",
    canon:
      "Gran amigo de David Ilcard. El grupo lo ayuda a terminar una misión acabando con unas súcubos.",
  },
  {
    tipo: "personaje",
    nombre: "Raylen",
    alias: ["El Tirador Blanco"],
    canon:
      "Gunslinger conocido en el Torneo de las Almas. 'El Tirador Blanco'. Originalmente miembro de Los Nefarios. En el Acto IV acepta un pacto con Luk (demonio) que le da poder a cambio de almas.",
  },
  {
    tipo: "personaje",
    nombre: "Amari Zaled",
    canon:
      "Teniente Coronel del Ejército de la Libertad. El grupo consigue su ayuda en el Acto III — promete enviar una escudería para ayudar contra el dragón rojo que ataca el hogar de Layra.",
  },
  {
    tipo: "personaje",
    nombre: "El Corruptor",
    canon:
      "Príncipe demoníaco, líder de Los Nefarios. Tiene algún tipo de trato con los altos cargos del Sanctuario de los Libres. Después de que el grupo elimina una emboscada suya, los Nefarios responden con una venganza brutal que mata a varios amigos del grupo incluyendo a Nym.",
  },

  // ─── NPCs — Acto IV (Mar del Leviatán) ───────────────────────────────────
  {
    tipo: "personaje",
    nombre: "Capitán Fóster",
    canon:
      "Capitán de 'El Diablillo', un barco flotante. El grupo se tepea a su barco usando la puerta mágica de Narcissa.",
  },
  {
    tipo: "personaje",
    nombre: "Luk",
    canon:
      "Demonio que pacta con Raylen en el Acto IV: poder a cambio de almas.",
  },

  // ─── NPCs — Líderes de facciones ─────────────────────────────────────────
  {
    tipo: "personaje",
    nombre: "Apolo Iorxan",
    canon:
      "Soberano de la Dinastía de las Alas Metálicas. Acordó un Voto de Confianza con la Hermandad: a cambio de eliminar ciertos enemigos y restaurar la paz en la Dinastía, libera monstruos en alrededores de Lorenza.",
  },
  {
    tipo: "personaje",
    nombre: "Orion Bolderminer",
    canon:
      "Emperador del Imperio de los Grandes (enanos). Mago. Acordó un Voto de Confianza con la Hermandad: envío de capital humano para trabajar sus nuevas tierras + enseñanza de agricultura eficiente, a cambio de metal para articulaciones y exoesqueletos.",
  },
  {
    tipo: "personaje",
    nombre: "Firguc Alasol",
    canon:
      "Clérigo, mano derecha de Orion Bolderminer en el Imperio de los Grandes.",
  },
  {
    tipo: "personaje",
    nombre: "Armola Caihana",
    alias: ["Voz de Yggdrasil"],
    canon:
      "Semi-elfa. 'Voz de Yggdrasil'. Una de las 3 líderes de Los Renegados. Acordó un Voto de Confianza con la Hermandad: ayuda con la revolución a cambio del asesinato del ejército de Lanceros del Alba (incluyendo a Ciollos y Mortoris Spiritcrown).",
  },
  {
    tipo: "personaje",
    nombre: "Saphira Nyerovik",
    canon:
      "Teniente Coronel. Lidera el grupo de choque especial de Los Renegados. Acompaña a Armola Caihana.",
  },
  {
    tipo: "personaje",
    nombre: "La Voz de Aldinach",
    canon: "Líder de los Tieflings dentro de Los Renegados.",
  },
  {
    tipo: "personaje",
    nombre: "Mortoris Spiritcrown",
    canon:
      "Teniente General de los Lanceros del Alba, principal ejército élfico. Objetivo del trato con Armola Caihana.",
  },

  // ─── Entidades divinas / planares (personajes aunque no humanos) ─────────
  {
    tipo: "personaje",
    nombre: "Wendigo",
    alias: ["Wendigoul"],
    canon:
      "Criatura etérea que persigue a Mysha desde el Acto II. Caminante etéreo. En el Acto IV se revela que el Coven Verde usó un ataque del Wendigo para infiltrarse en el Coven Rojo y robar el libro de rituales de la primera matriarca (Raven Queen).",
  },
  {
    tipo: "personaje",
    nombre: "La Dama del Dolor",
    canon:
      "Reina de Sigil, la Ciudad de las Puertas. Casi asesina a Narcissa cuando esta la ve usando una carta del tarot.",
  },
  {
    tipo: "personaje",
    nombre: "Demogorgon",
    canon:
      "Gran Demonio. Sus fuerzas atacaron a la mitad de la humanidad. Entendía cómo funcionaba el poder de la fe — esclavizaba humanos en vez de matarlos, ganando poder por el terror y la pérdida de fe en los dioses. Fue uno de los enemigos contra los que se hizo el Ritual de Ascensión.",
  },

  // ─── Facciones políticas y razas ─────────────────────────────────────────
  {
    tipo: "faccion",
    nombre: "Hermandad de Cobre",
    canon:
      "Grupo de 'rebeldes' que se esconde debajo del casino Plumas Doradas en la Metrópolis de Cobre. Liderada por Annora. El grupo se une a ellos en el Acto I.",
  },
  {
    tipo: "faccion",
    nombre: "La Gran Aristocracia",
    canon:
      "Facción de gobierno de la Metrópolis de Cobre. Compuesta principalmente por humanos y Tabaxis. Se gobierna por concejales: Industria y Defensa (exiliado), Salud/Educación/Trabajo (Vladimir Clarte), Justicia y Administración de Bienes (reemplazado por El Profesor), Innovación y Tecnología (El Profesor).",
  },
  {
    tipo: "faccion",
    nombre: "La Monarquía de Lefaye",
    canon:
      "Facción política compuesta principalmente por elfos, con algunos semi-elfos que se han ganado su lugar. Gobernada por un emperador. Su dios patrón es Lefaye.",
  },
  {
    tipo: "faccion",
    nombre: "La Dinastía de las Alas Metálicas",
    canon:
      "Facción política. Razas: Dracónicos, lizardfolk y Shuan Ti. Soberano: Apolo Iorxan.",
  },
  {
    tipo: "faccion",
    nombre: "Los Renegados",
    canon:
      "Facción política. Compuesta por todas las razas semi (semi-elfos, semi-orcos, etc.), además de algunos Tieflings y Kenkus. Lideres: Armola Caihana ('Voz de Yggdrasil'), Saphira Nyerovik (Teniente Coronel), La Voz de Aldinach (líder de tieflings).",
  },
  {
    tipo: "faccion",
    nombre: "Imperio de los Grandes",
    canon:
      "Facción política. Enanos. Emperador: Orion Bolderminer. Mano derecha: Firguc Alasol.",
  },
  {
    tipo: "faccion",
    nombre: "Aldea de Guerreros Espirituales",
    canon: "Facción/aldea. Orcos.",
  },
  {
    tipo: "faccion",
    nombre: "Aldea de Movedores de Montañas",
    canon: "Facción/aldea. Goliaths.",
  },
  {
    tipo: "faccion",
    nombre: "Manada de los Rompehuesos",
    canon: "Facción/manada. Monsters.",
  },
  {
    tipo: "faccion",
    nombre: "Aldeas de los Molinos",
    canon: "Facciones/aldeas. Halflings y gnomos.",
  },

  // ─── Otras facciones / grupos ────────────────────────────────────────────
  {
    tipo: "faccion",
    nombre: "Los Soñadores",
    canon:
      "Anterior grupo de aventureros de Nori. Incluye a Aria (warlock con pacto con Vecna).",
  },
  {
    tipo: "faccion",
    nombre: "Los Nefarios",
    canon:
      "Banda de mercenarios liderada por El Corruptor (príncipe demoníaco). Tienen tratos con altos cargos del Sanctuario de los Libres. Vengan brutalmente cualquier afrenta — matan a varios amigos del grupo en el Acto III.",
  },
  {
    tipo: "faccion",
    nombre: "Lanceros del Alba",
    canon:
      "Principal ejército élfico. Liderado por el Teniente General Ciollos y Mortoris Spiritcrown.",
  },
  {
    tipo: "faccion",
    nombre: "Ejército de la Libertad",
    canon:
      "Ejército asociado al Sanctuario. Amari Zaled es su Teniente Coronel.",
  },
  {
    tipo: "faccion",
    nombre: "Ejército de Eyra",
    alias: ["Las 9 Puntas"],
    canon:
      "Su símbolo es 'Las 9 Puntas'. Combatió contra los duergars de Khelgrim — los cadáveres de ambos lados fueron encontrados por el grupo en el Acto I.",
  },

  // ─── Covens (5 en total) ─────────────────────────────────────────────────
  {
    tipo: "faccion",
    nombre: "Coven Rojo",
    canon:
      "Uno de los 5 covens. Mysha empieza la campaña como miembro de este coven. Escribió el libro con la teoría del cuerpo/alma/espíritu. Sus secretos están protegidos por un ángel de Tyr (que el grupo mata en el Acto IV).",
  },
  {
    tipo: "faccion",
    nombre: "Coven Rosa",
    canon:
      "Uno de los 5 covens. Mysha se vuelve miembro más adelante en la trama. Aprendió a ver y usar el plano etéreo gracias a las runas de Mystra. Custodia de los caminantes etéreos durante los solsticios. La primera matriarca presentó el Ritual de Ascensión a los otros covens.",
  },
  {
    tipo: "faccion",
    nombre: "Coven Negro",
    alias: ["Black Coven"],
    canon:
      "Uno de los 5 covens. En el Acto I Mysha se presenta como 'bruja retirada del Coven Negro' — posiblemente como tapadera (su coven real es el Rojo).",
  },
  {
    tipo: "faccion",
    nombre: "Coven Blanco",
    canon: "Uno de los 5 covens.",
  },
  {
    tipo: "faccion",
    nombre: "Coven Verde",
    canon:
      "Uno de los 5 covens. Se opuso al Ritual de Ascensión por entender que causaría desbalance espiritual. Mystra subyugó a su matriarca para forzar su aceptación. La Matriarca Verde maldijo el ritual: 'que sus cuerpos sangren, que la naturaleza los odie'. En el Acto IV se revela que el Coven Verde usó un ataque del Wendigo para infiltrarse en el Coven Rojo y robar el libro de rituales.",
  },
  {
    tipo: "faccion",
    nombre: "Té de Medianoche",
    canon: "Facción/evento. Mencionada en los textos canónicos.",
  },

  // ─── Lugares ─────────────────────────────────────────────────────────────
  {
    tipo: "lugar",
    nombre: "Eyra",
    alias: ["Eyira"],
    canon: "El continente donde transcurre la campaña.",
  },
  {
    tipo: "lugar",
    nombre: "Metrópolis de Cobre",
    canon:
      "Ciudad steampunk medianamente grande. Habitada principalmente por humanos (con algunos Tabaxis). Bastión de los humanos protegido por una barrera invisible que la protege de tsunamis anuales. En esta ciudad la **magia está prohibida**. Es donde el grupo se conoce en el Acto I.",
  },
  {
    tipo: "lugar",
    nombre: "Plumas Doradas",
    canon:
      "Casino en la Metrópolis de Cobre. La Hermandad de Cobre se esconde debajo. Animado por Lord Faxius. Tiene 'La Ruleta de Vidrio' y la 'Carrera de Mecanismos'.",
  },
  {
    tipo: "lugar",
    nombre: "Lorenza",
    canon:
      "Aldea fronteriza atacada por gnolls. Tiene una excavación subterránea que lleva a Khelgrim. Carl Jhonson es el contacto del grupo en este pueblo.",
  },
  {
    tipo: "lugar",
    nombre: "Khelgrim",
    alias: ["El Último Bastión"],
    canon:
      "'El Último Bastión'. Ciudad subterránea de duergars seguidores fervientes de Vecna. Se accede por una excavación bajo Lorenza. El grupo encontró ahí los cadáveres de la batalla entre los duergars y el ejército de Eyra (Las 9 Puntas), junto al cuerpo maldito de Zaros Creighton.",
  },
  {
    tipo: "lugar",
    nombre: "Arkala",
    canon:
      "Una de las ciudades más ricas de Eyra. Ubicada en el Desierto de los Espejos. El comercio es el atractivo principal. El grupo se teletransporta acá al final del Acto I.",
  },
  {
    tipo: "lugar",
    nombre: "Desierto de los Espejos",
    canon:
      "Desierto cruzado por el grupo en el Acto II, guiados por Zhaar. Tormentas mágicas, Dopplegangers, ilusiones, ghouls y ghasts.",
  },
  {
    tipo: "lugar",
    nombre: "Sanctuario de los Libres",
    canon:
      "Ciudad enorme repleta de distintas razas (principalmente semis). La magia es moneda corriente y utilizada en todo momento. Sede del Torneo de las Almas y el festival de las culturas. Templos de Druidia, Luzne y Tyr.",
  },
  {
    tipo: "lugar",
    nombre: "Mar del Leviatán",
    canon: "Mar donde transcurre el Acto IV. Escenario de la búsqueda del artefacto que Borok ve en su visión.",
  },
  {
    tipo: "lugar",
    nombre: "Montañas de Frío Eterno",
    canon:
      "Escenario del Acto V. Hogar de Layra. El hielo eterno está derritiéndose por culpa de un dragón rojo que ataca la zona.",
  },
  {
    tipo: "lugar",
    nombre: "Sigil",
    alias: ["La Ciudad de las Puertas"],
    canon:
      "Ciudad gobernada por La Dama del Dolor. Vista por Narcissa al usar una carta del tarot — casi la mata por verla.",
  },
  {
    tipo: "lugar",
    nombre: "Feywilds",
    canon: "Plano feérico. Hogar del dragón padre de Layra.",
  },

  // ─── Dioses (como worldbuilding) ─────────────────────────────────────────
  {
    tipo: "worldbuilding",
    nombre: "Mystra",
    canon:
      "Dios principal. Magia Arcana. Creador de las **runas arcanas** y de la 'Magia Mística' (daño de fuerza), también conocida como **Magia Caótica**. Fue quien le dio al Coven Rosa la capacidad de atravesar el velo al Plano Etéreo. Subyugó a la Matriarca Verde para forzar el Ritual de Ascensión.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Vecna",
    canon: "Dios principal. Secretos, pérdida, dolor. Borok es su campeón al final del Acto IV. Aria tenía un pacto con él.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Locky",
    canon: "Dios principal. Caos, destrucción, engaño, ilusiones, guerra.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Tyr",
    canon: "Dios principal. Justicia y conocimiento. David Ilcard es su defensor (asimar). En el Acto IV el grupo mata un ángel de Tyr.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Leira",
    canon: "Diosa principal. Paz, serenidad, divinidad. Madre de Tymora.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Druidia",
    canon: "Diosa principal. 'Madre naturaleza', toda forma de vida plantoide. Madre de Umberlee y Talos.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Myrkul",
    canon: "Dios principal. Vida y muerte.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Raven Queen",
    canon: "Diosa principal. Recuerdos, almas, frío, sacrificio. Primera matriarca del Coven Rosa, ascendió a dios usando el Ritual de Ascensión.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Luzne",
    canon: "Diosa principal. Luz, fuego, renovación, sagrado. Tiene templo en el Sanctuario de los Libres.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Selune",
    canon: "Diosa principal. Luna, caza, oscuridad, sacrificio.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Orcus",
    canon: "Dios secundario. Dios orco. Guerrero de los espíritus.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Umberlee",
    canon: "Diosa secundaria. Mar. Hija de Druidia.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Talos",
    canon: "Dios secundario. Tormenta. Hijo de Druidia.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Tymora",
    canon: "Diosa secundaria. Suerte, diosa de los medianos. Hija de Leira.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Bahamut",
    canon: "Dios secundario. Dragones metálicos.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Tiamat",
    canon: "Diosa secundaria. Dragones elementales.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Moradín",
    canon: "Dios secundario. Dios enano de la forja, 'el forjador de almas'.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Lefaye",
    canon: "Dios/a secundario. Dios/a de los elfos. Arte, música, poesía. Patrono de la Monarquía de Lefaye.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Erina",
    canon: "Diosa secundaria. Hermana de Lefaye. Diosa de los elfos oscuros.",
  },
  {
    tipo: "worldbuilding",
    nombre: "El Dios de Dioses",
    canon:
      "Figura central del Ritual de Ascensión. Logró contener el ataque de Demogorgon en una mitad del continente. Terminó desterrado junto a la mitad de la humanidad cuando el ritual se completó.",
  },

  // ─── Conceptos del mundo (worldbuilding) ─────────────────────────────────
  {
    tipo: "worldbuilding",
    nombre: "Cuerpo, Alma y Espíritu",
    canon:
      "Teoría documentada en el libro del Coven Rojo. Un ser se divide en 3 partes: **Cuerpo** (parte física, con sensores que sienten el plano material), **Alma** (donde residen los sentimientos), y **Espíritu** (energía no material: impulso de vida, fe, voluntad). Los espíritus nacen en pares gemelos (uno humanoide, uno animal) conectados por un hilo — garantiza el balance entre humanoides y animales. Al morir: el cuerpo queda, el alma flota a los planos divinos, el espíritu reside en el Plano Etéreo.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Plano Etéreo",
    alias: ["Plano Espiritual"],
    canon:
      "Donde residen los espíritus tras la muerte. Inalcanzable para humanoides comunes. Mystra creó las runas arcanas para que el Coven Rosa pudiera atravesar el velo. En los **solsticios** (2 veces al año) la barrera se adelgaza y caminantes etéreos pueden cruzar al plano material; el Coven Rosa los contiene.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Magia Caótica",
    alias: ["Magia Mística"],
    canon:
      "Magia creada por Mystra. Daño de fuerza. Permite (combinada con el plano etéreo y las runas) realizar el Ritual de Ascensión.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Runas Arcanas",
    canon:
      "Creadas por Mystra. Permiten a los humanoides conectar de forma única cuerpo, alma y espíritu — atravesando el velo al Plano Etéreo. Normalmente se usan con un catalizador para proteger el cuerpo de la energía del otro plano.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Ritual de Ascensión",
    canon:
      "Ritual que convierte a alguien en **semidiós** (con suficiente poder para que otros lo crean dios). Costo: el espíritu de la mitad de la población. Lo presentó el Coven Rosa a los otros covens cuando estaban perdiendo la guerra contra Demogorgon y Vecna. Resultado histórico: la mitad de la humanidad fue desterrada del plano (cuerpo, alma y espíritu) junto al Dios de Dioses; Raven Queen (matriarca del Coven Rosa) ascendió a diosa. La Matriarca Verde maldijo el ritual antes de ser subyugada por Mystra para aceptarlo.",
  },
  {
    tipo: "worldbuilding",
    nombre: "Solsticios",
    canon:
      "Dos veces al año la barrera entre el plano material y el espiritual se adelgaza. Caminantes etéreos pueden cruzar al mundo material. Responsabilidad del Coven Rosa contenerlos.",
  },

  // ─── Objetos ─────────────────────────────────────────────────────────────
  {
    tipo: "objeto",
    nombre: "Wheel of Fortune",
    canon:
      "Carta legendaria del tarot. Una de las 'cartas de la fortuna'. Zaros Creighton la tenía cuando el grupo lo encontró en Khelgrim. Zhaar tenía 2 más. Narcissa usa una para ver Sigil. En el Acto V el grupo finalmente la usa y aparece un genio/semi-dios que intercambia deseos.",
  },
  {
    tipo: "objeto",
    nombre: "Libro del Ritual de Ascensión",
    canon:
      "Libro escrito por la primera matriarca del Coven Rosa (Raven Queen). Documenta el Ritual de Ascensión. En el Acto IV se revela que el Coven Verde, usando un ataque del Wendigo, se infiltró en el Coven Rojo para robarlo.",
  },
  {
    tipo: "objeto",
    nombre: "Artefacto disipador",
    canon:
      "Obtenido por el grupo al final del Acto IV en el Mar del Leviatán. Puede disipar cualquier magia, incluso de nivel 9.",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const out: Record<string, string> = {};
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const CANON_SECTION_HEADER = "## Canon (del DM)";
const MENCIONES_SECTION_HEADER = "## Menciones por episodio";

/**
 * Construye o actualiza el archivo .md para una entidad seed.
 *  - Si no existe → crea con frontmatter origen:"glosario", canon section, y menciones vacías.
 *  - Si existe → merge: preserva apariciones/relaciones/menciones, reemplaza canon section,
 *    mergea alias.
 */
/**
 * Aplica los campos de taxonomía al frontmatter (solo los definidos).
 * No pisa valores existentes en el archivo a menos que la taxonomía los redefina.
 */
function applyTaxonomy(fm: Record<string, unknown>, tax: Taxonomy): void {
  if (tax.rol !== undefined) fm.rol = tax.rol;
  if (tax.jugador !== undefined) fm.jugador = tax.jugador;
  if (tax.facciones !== undefined) fm.facciones = tax.facciones;
  if (tax.region !== undefined) fm.region = tax.region;
  if (tax.categoria !== undefined) fm.categoria = tax.categoria;
  if (tax.acto !== undefined) fm.acto = tax.acto;
}

function buildEntityContent(seed: SeedEntity, existing: string | null): string {
  const canonBlock = `${CANON_SECTION_HEADER}\n\n${seed.canon.trim()}\n`;
  const tax: Taxonomy = TAXONOMY[seed.nombre] ?? {};

  if (!existing) {
    const fm: Record<string, unknown> = {
      tipo: seed.tipo,
      nombre: seed.nombre,
      alias: seed.alias ?? [],
      apariciones: [] as number[],
      origen: "glosario",
      ultima_actualizacion: new Date().toISOString(),
    };
    applyTaxonomy(fm, tax);
    const body = `${canonBlock}\n${MENCIONES_SECTION_HEADER}\n`;
    return matter.stringify("\n" + body + "\n", fm);
  }

  // Merge con archivo existente
  const parsed = matter(existing);
  const fm = { ...parsed.data } as Record<string, unknown>;

  // Mergear alias
  const existingAlias = (fm.alias as string[]) ?? [];
  const newAlias = seed.alias ?? [];
  fm.alias = Array.from(new Set([...existingAlias, ...newAlias]));

  // Marcar origen como "glosario" si no había origen, sino mantenerlo
  if (!fm.origen) fm.origen = "glosario";

  // Aplicar/actualizar taxonomía (sobreescribe valores anteriores con los del map)
  applyTaxonomy(fm, tax);

  fm.ultima_actualizacion = new Date().toISOString();

  // Body: reemplazar/insertar la sección Canon, preservar el resto
  let body = (parsed.content ?? "").trim();

  // Regex para detectar y reemplazar la sección Canon existente
  const canonRegex = new RegExp(
    `${escapeRegExp(CANON_SECTION_HEADER)}\\n\\n[\\s\\S]*?(?=\\n## |$)`,
    ""
  );

  if (canonRegex.test(body)) {
    body = body.replace(canonRegex, canonBlock.trimEnd() + "\n\n");
  } else {
    // No había canon: insertar al inicio del body
    body = canonBlock + "\n" + body;
  }

  // Si no había sección de menciones, agregarla al final
  if (!body.includes(MENCIONES_SECTION_HEADER)) {
    body = body.trimEnd() + "\n\n" + MENCIONES_SECTION_HEADER + "\n";
  }

  return matter.stringify("\n" + body.trim() + "\n", fm);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const env = { ...process.env, ...loadEnv() };
  const vaultRaw = env.VAULT_PATH?.trim();
  if (!vaultRaw) {
    console.error("Error: VAULT_PATH no está definida en .env.local");
    process.exit(1);
  }
  const vaultPath = path.resolve(vaultRaw);
  if (!fs.existsSync(vaultPath)) {
    console.error(`Error: VAULT_PATH no existe: ${vaultPath}`);
    process.exit(1);
  }

  console.log(`\n🌱 Mysha — Seeder de glosario`);
  console.log(`   Vault: ${vaultPath}`);
  console.log(`   Entidades a sembrar: ${SEED.length}`);
  console.log(`   ${dryRun ? "DRY-RUN (no se escribe nada)" : "Modo: escritura real"}\n`);

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const seed of SEED) {
    const folder = ENTITY_FOLDERS[seed.tipo];
    const dir = path.join(vaultPath, folder);
    fs.mkdirSync(dir, { recursive: true });

    const slug = slugify(seed.nombre);
    const filePath = path.join(dir, slug + ".md");

    let existing: string | null = null;
    try {
      existing = fs.readFileSync(filePath, "utf-8");
    } catch {
      existing = null;
    }

    const newContent = buildEntityContent(seed, existing);

    if (existing && existing.trim() === newContent.trim()) {
      unchanged++;
      continue;
    }

    const action = existing ? "actualizar" : "crear";
    const label = `[${seed.tipo}] ${seed.nombre} → ${path.relative(vaultPath, filePath)}`;
    console.log(`   ${existing ? "✱" : "+"} ${action.padEnd(10)} ${label}`);

    if (!dryRun) {
      const tmp = filePath + ".tmp";
      fs.writeFileSync(tmp, newContent, "utf-8");
      fs.renameSync(tmp, filePath);
    }

    if (existing) updated++;
    else created++;
  }

  console.log(`\n✅ Resumen:`);
  console.log(`   creadas:    ${created}`);
  console.log(`   actualizadas: ${updated}`);
  console.log(`   sin cambios: ${unchanged}`);
  console.log(`   total seed:  ${SEED.length}`);
  if (dryRun) console.log(`\n   (dry-run — re-ejecutá sin --dry-run para aplicar)`);
}

main().catch((err) => {
  console.error("\n❌ Error fatal:", err);
  process.exit(1);
});
