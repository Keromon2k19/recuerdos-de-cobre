import { describe, expect, it } from "vitest";
import { resolveAtlasV2CharacterRole } from "@/lib/atlas-v2-character-role";

describe("atlas-v2 character role resolver", () => {
  it("marca los personajes jugadores como PJ aunque el vault diga NPC", () => {
    expect(resolveAtlasV2CharacterRole("rylen", "NPC")).toBe("PJ");
    expect(resolveAtlasV2CharacterRole("raylen", "NPC")).toBe("PJ");
    expect(resolveAtlasV2CharacterRole("borok")).toBe("PJ");
  });

  it("preserva roles de personajes no jugadores", () => {
    expect(resolveAtlasV2CharacterRole("anora", "NPC")).toBe("NPC");
    expect(resolveAtlasV2CharacterRole("champi", "familiar")).toBe("familiar");
  });
});
