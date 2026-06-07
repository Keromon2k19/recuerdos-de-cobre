import type { V2Character } from "@/data/atlas-v2/characters";

type SearchableCharacter = Pick<
  V2Character,
  "nombre" | "slug" | "rol" | "epiteto" | "facciones" | "aliases"
>;

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function characterMatchesSearch(
  character: SearchableCharacter,
  rawQuery: string,
): boolean {
  const query = normalizeSearch(rawQuery);
  if (!query) return true;

  return [
    character.nombre,
    character.slug,
    character.rol,
    character.epiteto,
    ...character.facciones,
    ...(character.aliases ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeSearch(value))
    .join(" ")
    .includes(query);
}
