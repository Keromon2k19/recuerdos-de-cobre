import AtlasVaultEntityPage, {
  buildAtlasV2EntityMetadata,
} from "@/components/atlas-v2/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasV2EntityMetadata("objeto", (await params).slug);
}

export default async function ObjetoDetailPage({ params }: Props) {
  return (
    <AtlasVaultEntityPage
      kind="objeto"
      slug={(await params).slug}
      variant="relic"
      backHref="/objetos"
      backLabel="Volver a objetos"
      eyebrow="Pieza catalogada"
    />
  );
}
