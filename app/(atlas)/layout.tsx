// app/(atlas)/layout.tsx — Layout exclusivo de la UI V2.
// Escapa del route group (public) — no hereda SiteHeader ni SiteFooter de V1.
// Solo hereda el root layout (app/layout.tsx): html + body + anti-FOUC script.
import "../globals.css";
import "./atlas-tokens.css";
import "./atlas-layout.css";
import "./atlas-nav.css";
import "./atlas-home.css";
import "./atlas-reproductor.css";
import "./atlas-mapa.css";
import "./atlas-dioses.css";
import "./atlas-facciones.css";
import "./atlas-lugares.css";
import "./atlas-timeline.css";
import "./atlas-personajes.css";
import "./atlas-cronicas.css";
import "./atlas-buscar.css";
import "./atlas-te-de-media-noche.css";
import "./atlas-transitions.css";
import AtlasShell from "@/components/atlas/AtlasShell";
import AtlasTopNav from "@/components/atlas/AtlasTopNav";
import AtlasViewTransitions from "@/components/atlas/AtlasViewTransitions";

export const metadata = {
  title: "Grimorio de Lore · Recuerdos de Cobre",
  description:
    "El atlas de lore de la campaña Recuerdos de Cobre. Personajes, lugares, facciones y crónicas del archivo.",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=Spectral:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <AtlasShell>
        <AtlasViewTransitions />
        <AtlasTopNav />
        <main className="av2-route-surface">{children}</main>
      </AtlasShell>
    </>
  );
}
