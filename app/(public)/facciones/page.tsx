// app/(public)/facciones/page.tsx
import EntityList from "@/components/public/EntityList";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Facciones · Recuerdos de Cobre",
  description: "Gremios, covens y poderes de Recuerdos de Cobre.",
};

export default function FaccionesPage() {
  return <EntityList tipo="faccion" />;
}
