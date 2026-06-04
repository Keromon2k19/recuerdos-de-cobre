// app/(v2)/v2/layout.tsx — Layout exclusivo de la UI V2.
// Escapa del route group (public) — no hereda SiteHeader ni SiteFooter de V1.
// Solo hereda el root layout (app/layout.tsx): html + body + anti-FOUC script.
import "./atlas-v2.css";
import AtlasShell from "@/components/atlas-v2/AtlasShell";
import AtlasTopNav from "@/components/atlas-v2/AtlasTopNav";

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
        <AtlasTopNav />
        <main>{children}</main>
      </AtlasShell>
    </>
  );
}
