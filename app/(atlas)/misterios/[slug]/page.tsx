import AtlasVaultEntityPage, {
  buildAtlasEntityMetadata,
} from "@/components/atlas/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasEntityMetadata("misterio", (await params).slug);
}

export default async function MisterioDetailPage({ params }: Props) {
  return (
    <AtlasVaultEntityPage
      kind="misterio"
      slug={(await params).slug}
      variant="mystery"
      backHref="/misterios"
      backLabel="Volver a misterios"
      eyebrow="Investigación abierta"
    />
  );
}
