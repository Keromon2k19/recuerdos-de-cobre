import AtlasVaultEntityPage, {
  buildAtlasV2EntityMetadata,
} from "@/components/atlas-v2/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasV2EntityMetadata("faccion", (await params).slug);
}

export default async function FaccionDetailPage({ params }: Props) {
  return (
    <AtlasVaultEntityPage
      kind="faccion"
      slug={(await params).slug}
      variant="faction"
      backHref="/facciones"
      backLabel="Volver a facciones"
      eyebrow="Registro de poder"
    />
  );
}
