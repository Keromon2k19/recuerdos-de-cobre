import AtlasVaultEntityPage, {
  buildAtlasEntityMetadata,
} from "@/components/atlas/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasEntityMetadata("personaje", (await params).slug);
}

export default async function PersonajeDetailPage({ params }: Props) {
  return (
    <AtlasVaultEntityPage
      kind="personaje"
      slug={(await params).slug}
      variant="character"
      backHref="/personajes"
      backLabel="Volver a personajes"
      eyebrow="Expediente de personaje"
    />
  );
}
