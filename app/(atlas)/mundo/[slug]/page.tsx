import AtlasVaultEntityPage, {
  buildAtlasEntityMetadata,
} from "@/components/atlas/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasEntityMetadata("worldbuilding", (await params).slug);
}

export default async function MundoDetailPage({ params }: Props) {
  return (
    <AtlasVaultEntityPage
      kind="worldbuilding"
      slug={(await params).slug}
      variant="world"
      backHref="/mundo"
      backLabel="Volver al mundo"
      eyebrow="Regla del mundo"
    />
  );
}
