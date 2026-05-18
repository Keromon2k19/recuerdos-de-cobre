// app/(public)/personajes/[slug]/page.tsx — Ficha de personaje (genérica).
import type { Metadata } from "next";
import EntityDetail from "@/components/public/EntityDetail";
import { buildEntityMetadata } from "@/lib/public-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildEntityMetadata("personaje", (await params).slug);
}

export default async function FichaPersonaje({ params }: Props) {
  const { slug } = await params;
  return <EntityDetail tipo="personaje" slug={slug} />;
}
