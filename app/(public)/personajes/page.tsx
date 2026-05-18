// app/(public)/personajes/page.tsx — Listado de personajes (genérico).
import EntityList from "@/components/public/EntityList";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Personajes · Recuerdos de Cobre",
  description: "Quién es quién en la campaña Recuerdos de Cobre.",
};

export default function PersonajesPage() {
  return <EntityList tipo="personaje" />;
}
