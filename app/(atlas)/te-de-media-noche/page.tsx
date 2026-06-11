import AtlasPageScene from "@/components/atlas/AtlasPageScene";
import AtlasConstellation from "@/components/atlas/AtlasConstellation";
import { TDMN_MEMBERS } from "@/data/atlas/te-de-media-noche";
import { buildConstellation } from "@/lib/te-de-media-noche";
import { TDMN_STATS } from "@/data/atlas/tdmn-stats";
import { cachedAtlasEntityDetail } from "@/lib/public-cache";
import { cachedBuildAtlasWikiResolver } from "@/lib/wiki-resolver";
import { publicVaultPath } from "@/lib/public-vault-path";
import type { AtlasEntityDetail } from "@/lib/atlas-content";

export const dynamic = "force-static";

export const metadata = {
  title: "Té de Media Noche · Grimorio de Lore",
  description:
    "Los integrantes del grupo de la campaña Recuerdos de Cobre y los vínculos que los unen.",
};

export default async function TeDeMediaNochePage() {
  const vaultPath = publicVaultPath();
  // Tuple de 2 (no spread) para que TS conserve los tipos de cada parte.
  const [resolve, details] = await Promise.all([
    cachedBuildAtlasWikiResolver(vaultPath),
    Promise.all(
      TDMN_MEMBERS.map((m) =>
        cachedAtlasEntityDetail(vaultPath, "personaje", m.slug),
      ),
    ),
  ]);

  const detailMap = new Map<string, AtlasEntityDetail | null>(
    TDMN_MEMBERS.map((m, i) => [m.slug, details[i] ?? null]),
  );
  const data = buildConstellation(detailMap, resolve, TDMN_STATS);

  return (
    <AtlasPageScene
      eyebrow="El grupo de la campaña"
      title="Té de Media Noche"
      subtitle="Diez destinos cruzados. Tocá a un integrante para abrir sus vínculos; otro click abre su expediente."
      variant="tdmn"
    >
      <AtlasConstellation data={data} />
    </AtlasPageScene>
  );
}
