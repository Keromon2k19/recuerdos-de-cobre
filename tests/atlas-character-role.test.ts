import { describe, expect, it } from "vitest";
import { resolveAtlasCharacterRole } from "@/lib/atlas-character-role";

describe("atlas character role resolver", () => {
  it("marca los personajes jugadores como PJ aunque el vault diga NPC", () => {
    expect(resolveAtlasCharacterRole("rylen", "NPC")).toBe("PJ");
    expect(resolveAtlasCharacterRole("raylen", "NPC")).toBe("PJ");
    expect(resolveAtlasCharacterRole("borok")).toBe("PJ");
  });

  it("preserva roles de personajes no jugadores", () => {
    expect(resolveAtlasCharacterRole("anora", "NPC")).toBe("NPC");
    expect(resolveAtlasCharacterRole("champi", "familiar")).toBe("familiar");
  });
});
