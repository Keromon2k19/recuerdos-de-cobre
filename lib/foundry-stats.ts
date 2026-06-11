// lib/foundry-stats.ts
// Parser PURO de un actor exportado de FoundryVTT (dnd5e 5.3.2) → ficha
// técnica "Esencial". Sin I/O. Incluye traducción dnd5e→español.

export type Ability = { value: number; mod: number };
export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type MemberStats = {
  clase: string;
  nivel: number;
  ac: number | null;
  hpMax: number;
  speed: string;
  abilities: Record<AbilityKey, Ability>;
  resistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string[];
  languages: string[];
};

const DAMAGE_ES: Record<string, string> = {
  acid: "Ácido", bludgeoning: "Contundente", cold: "Frío", fire: "Fuego",
  force: "Fuerza", lightning: "Relámpago", necrotic: "Necrótico", poison: "Veneno",
  psychic: "Psíquico", radiant: "Radiante", slashing: "Cortante", piercing: "Perforante",
  thunder: "Trueno",
};
const CONDITION_ES: Record<string, string> = {
  blinded: "Cegado", charmed: "Hechizado", deafened: "Ensordecido", frightened: "Asustado",
  grappled: "Apresado", incapacitated: "Incapacitado", invisible: "Invisible",
  paralyzed: "Paralizado", petrified: "Petrificado", poisoned: "Envenenado", prone: "Derribado",
  restrained: "Restringido", stunned: "Aturdido", unconscious: "Inconsciente",
  exhaustion: "Agotamiento", sleep: "Dormir", diseased: "Enfermo",
};
const LANGUAGE_ES: Record<string, string> = {
  common: "Común", dwarvish: "Enano", elvish: "Élfico", giant: "Gigante", gnomish: "Gnómico",
  goblin: "Goblin", halfling: "Mediano", orc: "Orco", abyssal: "Abisal", celestial: "Celestial",
  draconic: "Dracónico", deep: "Habla Profunda", infernal: "Infernal", primordial: "Primordial",
  sylvan: "Silvano", undercommon: "Infracomún",
};
const SENSE_ES: Record<string, string> = {
  darkvision: "Visión en la oscuridad", blindsight: "Visión ciega",
  tremorsense: "Sentido sísmico", truesight: "Visión verdadera",
};

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Traduce una lista `value[]` + `custom` (coma-separado, texto libre) a español.
function traitList(node: unknown, map: Record<string, string>): string[] {
  const n = (node ?? {}) as { value?: unknown; custom?: unknown };
  const out: string[] = [];
  for (const k of Array.isArray(n.value) ? (n.value as string[]) : []) {
    out.push(map[k] ?? cap(String(k)));
  }
  if (typeof n.custom === "string" && n.custom.trim()) {
    for (const raw of n.custom.split(",")) {
      const k = raw.trim();
      if (k) out.push(map[k.toLowerCase()] ?? cap(k));
    }
  }
  return [...new Set(out)];
}

function abilityMod(value: number): number {
  return Math.floor((value - 10) / 2);
}

export function parseFoundryActor(actor: unknown): MemberStats {
  const a = (actor ?? {}) as any;
  const sys = a.system ?? {};
  const items: any[] = Array.isArray(a.items) ? a.items : [];

  // Clase / nivel
  const classes = items.filter((it) => it?.type === "class");
  const nivel = classes.reduce((sum, c) => sum + (Number(c?.system?.levels) || 0), 0);
  const original = classes.find((c) => c?._id === sys?.details?.originalClass);
  const clase = (original ?? classes[0])?.name ?? "";

  // Atributos
  const abil = (sys.abilities ?? {}) as Record<string, { value?: number }>;
  const ability = (k: AbilityKey): Ability => {
    const v = Number(abil[k]?.value) || 0;
    return { value: v, mod: abilityMod(v) };
  };
  const abilities: Record<AbilityKey, Ability> = {
    str: ability("str"), dex: ability("dex"), con: ability("con"),
    int: ability("int"), wis: ability("wis"), cha: ability("cha"),
  };

  // AC: flat numérico, o formula numérica, o null.
  const acNode = sys.attributes?.ac ?? {};
  let ac: number | null = null;
  if (typeof acNode.flat === "number") ac = acNode.flat;
  else if (acNode.formula != null && acNode.formula !== "" && Number.isFinite(Number(acNode.formula))) ac = Number(acNode.formula);

  // HP máximo (nunca el value/temp en vivo)
  const hpMax = Number(sys.attributes?.hp?.max) || 0;

  // Velocidad (solo walk; fly/swim/burrow se ignoran por diseño en la ficha Esencial)
  const mv = sys.attributes?.movement ?? {};
  const walk = mv.walk != null && mv.walk !== "" ? `${mv.walk} ${mv.units ?? "ft"}` : "";

  // Sentidos: rangos > 0 + especial verbatim
  const senses: string[] = [];
  const ranges = (sys.attributes?.senses?.ranges ?? {}) as Record<string, number | null>;
  const sUnits = sys.attributes?.senses?.units ?? "ft";
  for (const [k, v] of Object.entries(ranges)) {
    if (typeof v === "number" && v > 0) senses.push(`${SENSE_ES[k] ?? cap(k)} ${v} ${sUnits}`);
  }
  const special = sys.attributes?.senses?.special;
  if (typeof special === "string" && special.trim()) senses.push(special.trim());

  return {
    clase,
    nivel,
    ac,
    hpMax,
    speed: walk,
    abilities,
    resistances: traitList(sys.traits?.dr, DAMAGE_ES),
    damageImmunities: traitList(sys.traits?.di, DAMAGE_ES),
    conditionImmunities: traitList(sys.traits?.ci, CONDITION_ES),
    senses,
    languages: traitList(sys.traits?.languages, LANGUAGE_ES),
  };
}
