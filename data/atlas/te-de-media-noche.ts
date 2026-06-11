// data/atlas/te-de-media-noche.ts
// Membresía de Té de Media Noche — curada a mano (el vault no registra
// grupos). El orden del array es el orden del anillo. La etiqueta visible
// gana sobre `rol:` del vault (David/Borok figuran PJ en el vault pero
// Joaquín los clasifica distinto para esta vista).

export type TdmnEstado = "activo" | "separado";

export type TdmnMemberConfig = {
  slug: string;          // slug del .md en vault personajes/
  nombre: string;        // display name (fallback si el vault no carga)
  etiqueta: string;      // eyebrow del expediente
  rolCorto: string;      // stat "rol" del expediente
  estado: TdmnEstado;
  raza?: string;        // curado — Foundry lo tiene vacío (race: null)
  edad?: string;        // curado — Foundry lo tiene vacío
  altura?: string;      // curado — Foundry lo tiene vacío
};

// Etiquetas sin prefijo PJ/NPC: la audiencia es el propio grupo y el DM —
// ya saben quién es quién. La etiqueta describe al personaje, no su rol.
export const TDMN_MEMBERS: TdmnMemberConfig[] = [
  { slug: "mysha", nombre: "Mysha", etiqueta: "Bruja de Sangre · Líder actual", rolCorto: "PJ", estado: "activo", raza: "Humana", edad: "16", altura: "1,65 m" },
  { slug: "layra", nombre: "Layra", etiqueta: "Dracónica", rolCorto: "PJ", estado: "activo" },
  { slug: "narcissa", nombre: "Narcissa", etiqueta: "", rolCorto: "PJ", estado: "activo" },
  { slug: "io-campbell", nombre: "Io Campbell", etiqueta: "Druida, Retoño de Trent", rolCorto: "PJ", estado: "activo" },
  { slug: "eryon", nombre: "Eryon", etiqueta: "", rolCorto: "PJ", estado: "activo" },
  { slug: "david-ilcard", nombre: "David Ilcard", etiqueta: "Compañero del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "rylen", nombre: "Rylen", etiqueta: "Compañero del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "pilar", nombre: "Pilar", etiqueta: "Compañera del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "pat-pat", nombre: "Pat-Pat", etiqueta: "Compañera del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "borok", nombre: "Borok", etiqueta: "Primer líder · se separó", rolCorto: "Ex líder", estado: "separado" },
];

// Vínculos rotos curados (estuvo y se fue): pares [a, b].
// El orden del par es irrelevante — el vínculo es no dirigido.
export const TDMN_CUT_LINKS: Array<[string, string]> = [["borok", "mysha"]];
