import type { ReactNode } from "react";
import AtlasPageHeader from "./AtlasPageHeader";
import { DEFAULT_HERO_BACKGROUND } from "@/data/atlas/hero-backgrounds";

type Props = {
  eyebrow: string;
  title: ReactNode;
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
  backgroundSrc = DEFAULT_HERO_BACKGROUND.src,
  variant,
  className = "",
  children,
}: Props) {
  return (
    <section
      className={`av2-page-scene ${className}`.trim()}
      data-variant={variant}
      data-bg={backgroundSrc ? "image" : "material"}
    >
      <div className="av2-page-scene-bg" aria-hidden="true">
        {backgroundSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundSrc} alt="" />
        ) : null}
      </div>

      <AtlasPageHeader eyebrow={eyebrow} title={title} intro={subtitle} />

      <div className="av2-page-scene-content">{children}</div>
    </section>
  );
}
