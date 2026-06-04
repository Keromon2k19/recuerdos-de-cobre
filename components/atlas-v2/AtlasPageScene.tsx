import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  backgroundSrc?: string;
  variant?: string;
  className?: string;
  children: ReactNode;
};

export default function AtlasPageScene({
  eyebrow,
  title,
  subtitle,
  backgroundSrc = "/assets/atlas-v2/backgrounds/hero.png",
  variant,
  className = "",
  children,
}: Props) {
  return (
    <section
      className={`av2-page-scene ${className}`.trim()}
      data-variant={variant}
    >
      <div className="av2-page-scene-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backgroundSrc} alt="" />
      </div>

      <header className="av2-page-scene-head">
        <p className="av2-page-scene-eyebrow">{eyebrow}</p>
        <h1 className="av2-page-scene-title">{title}</h1>
        {subtitle && <p className="av2-page-scene-subtitle">{subtitle}</p>}
      </header>

      <div className="av2-page-scene-content">{children}</div>
    </section>
  );
}
