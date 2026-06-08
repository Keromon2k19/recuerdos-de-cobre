import AtlasVaultEntityPage, {
  buildAtlasEntityMetadata,
} from "@/components/atlas/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasEntityMetadata("objeto", (await params).slug);
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
