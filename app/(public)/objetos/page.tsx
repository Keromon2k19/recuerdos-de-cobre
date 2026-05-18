// app/(public)/objetos/page.tsx
import EntityList from "@/components/public/EntityList";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Objetos · Recuerdos de Cobre",
  description: "Artefactos y objetos con peso narrativo.",
};

export default function ObjetosPage() {
  return <EntityList tipo="objeto" />;
}
