import AtlasVaultEntityPage, {
  buildAtlasV2EntityMetadata,
} from "@/components/atlas-v2/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasV2EntityMetadata("misterio", (await params).slug);
}

export default async function MisterioDetailPage({ params }: Props) {
  return (
    <AtlasVaultEntityPage
      kind="misterio"
      slug={(await params).slug}
      variant="mystery"
      backHref="/v2/misterios"
      backLabel="Volver a misterios"
      eyebrow="Investigación abierta"
    />
  );
}
