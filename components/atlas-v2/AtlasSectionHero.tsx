// components/atlas-v2/AtlasSectionHero.tsx
// Foco/hero de sección. variant="image": foto grande con marco de cobre.
// variant="material": glifo/sigilo material cuando no hay imagen propia.
// layout="stack" (default): foco arriba + caption debajo (ficha, catálogo).
// layout="inline": foco a la izquierda + caption a la derecha (expediente).
type Props = {
  variant: "image" | "material";
  imageSrc?: string;
  glyph: string;
  alt: string;
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  showCaption?: boolean;
  layout?: "stack" | "inline";
};

export default function AtlasSectionHero({
  variant,
  imageSrc,
  glyph,
  alt,
  eyebrow,
  title,
  description,
  meta,
  showCaption = true,
  layout = "stack",
}: Props) {
  const showImage = variant === "image" && Boolean(imageSrc);
  return (
    <div
      className="av2-section-hero"
      data-variant={showImage ? "image" : "material"}
      data-layout={layout}
    >
      <div className="av2-section-hero-rings" aria-hidden="true" />
      <div className="av2-section-hero-focus">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={alt} />
        ) : (
          <span aria-hidden="true">{glyph}</span>
        )}
      </div>
      {showCaption && (
        <div className="av2-section-hero-caption">
          {eyebrow && <p>{eyebrow}</p>}
          <h2>{title}</h2>
          {description && <p className="av2-section-hero-desc">{description}</p>}
          {meta && <span>{meta}</span>}
        </div>
      )}
    </div>
  );
}
