// app/(public)/misterios/page.tsx
import EntityList from "@/components/public/EntityList";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Misterios · Recuerdos de Cobre",
  description: "Los hilos abiertos que siguen sin respuesta.",
};

export default function MisteriosPage() {
  return <EntityList tipo="misterio" />;
}
