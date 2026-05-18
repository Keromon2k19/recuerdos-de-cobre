// app/(public)/lugares/page.tsx
import EntityList from "@/components/public/EntityList";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lugares · Recuerdos de Cobre",
  description: "Dónde ocurrió cada cosa en Recuerdos de Cobre.",
};

export default function LugaresPage() {
  return <EntityList tipo="lugar" />;
}
