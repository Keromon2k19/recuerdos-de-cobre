const PLAYER_CHARACTER_SLUGS = new Set([
  "mysha",
  "borok",
  "layra",
  "narcissa",
  "david-ilcard",
  "io-campbell",
  "rylen",
  "raylen",
]);

export function resolveAtlasCharacterRole(
  slug: string,
  role?: string,
): string {
  if (PLAYER_CHARACTER_SLUGS.has(slug)) return "PJ";
  return role ?? "NPC";
}
