// components/atlas/AtlasPageHeader.tsx
// Encabezado de página V2 — misma gramática que el hero del home, en escala
// "sección": eyebrow mono + ornamento (rombo) + título display + intro.
import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  align?: "center" | "left";
};

export default function AtlasPageHeader({
  eyebrow,
  title,
  intro,
  align = "center",
}: Props) {
  return (
    <header className="av2-page-header" data-align={align}>
      <p className="av2-page-header-eyebrow">{eyebrow}</p>
      <div className="av2-ornament" aria-hidden="true">
        <span className="av2-ornament-diamond" />
      </div>
      {title && <h1 className="av2-page-header-title">{title}</h1>}
      {intro && <p className="av2-page-header-intro">{intro}</p>}
    </header>
  );
}
