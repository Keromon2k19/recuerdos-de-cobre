// app/(public)/worldbuilding/page.tsx
import EntityList from "@/components/public/EntityList";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Worldbuilding · Recuerdos de Cobre",
  description: "Cómo funciona el mundo de Cobre.",
};

export default function WorldbuildingPage() {
  return <EntityList tipo="worldbuilding" />;
}
