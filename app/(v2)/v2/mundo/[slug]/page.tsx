import AtlasVaultEntityPage, {
  buildAtlasV2EntityMetadata,
} from "@/components/atlas-v2/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasV2EntityMetadata("worldbuilding", (await params).slug);
}

export default async function MundoDetailPage({ params }: Props) {
  return (
    <AtlasVaultEntityPage
      kind="worldbuilding"
      slug={(await params).slug}
      variant="world"
      backHref="/v2/mundo"
      backLabel="Volver al mundo"
      eyebrow="Regla del mundo"
    />
  );
}
