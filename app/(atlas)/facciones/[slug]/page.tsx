import AtlasVaultEntityPage, {
  buildAtlasEntityMetadata,
} from "@/components/atlas/AtlasVaultEntityPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return buildAtlasEntityMetadata("faccion", (await params).slug);
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
