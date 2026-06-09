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
};

export const TDMN_MEMBERS: TdmnMemberConfig[] = [
  { slug: "mysha", nombre: "Mysha", etiqueta: "PJ · Bruja de Sangre · Líder actual", rolCorto: "PJ", estado: "activo" },
  { slug: "layra", nombre: "Layra", etiqueta: "PJ · Dracónica", rolCorto: "PJ", estado: "activo" },
  { slug: "narcissa", nombre: "Narcissa", etiqueta: "PJ", rolCorto: "PJ", estado: "activo" },
  { slug: "io-campbell", nombre: "Io Campbell", etiqueta: "PJ · Druida, Retoño de Trent", rolCorto: "PJ", estado: "activo" },
  { slug: "eryon", nombre: "Eryon", etiqueta: "PJ", rolCorto: "PJ", estado: "activo" },
  { slug: "david-ilcard", nombre: "David Ilcard", etiqueta: "NPC · Compañero del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "rylen", nombre: "Rylen", etiqueta: "NPC · Compañero del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "pilar", nombre: "Pilar", etiqueta: "NPC · Compañera del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "pat-pat", nombre: "Pat-Pat", etiqueta: "NPC · Compañera del grupo", rolCorto: "NPC", estado: "activo" },
  { slug: "borok", nombre: "Borok", etiqueta: "Primer líder · se separó", rolCorto: "Ex líder", estado: "separado" },
];

// Vínculos rotos curados (estuvo y se fue): pares [a, b].
export const TDMN_CUT_LINKS: Array<[string, string]> = [["borok", "mysha"]];
