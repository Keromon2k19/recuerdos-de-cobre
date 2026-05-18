// app/(public)/misterios/[slug]/page.tsx
import type { Metadata } from "next";
import EntityDetail from "@/components/public/EntityDetail";
import { buildEntityMetadata } from "@/lib/public-meta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return buildEntityMetadata("misterio", (await params).slug);
}

export default async function FichaMisterio({ params }: Props) {
  const { slug } = await params;
  return <EntityDetail tipo="misterio" slug={slug} />;
}
