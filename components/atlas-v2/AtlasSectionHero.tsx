// components/atlas-v2/AtlasSectionHero.tsx
// Foco/hero de sección. variant="image": foto grande con marco de cobre.
// variant="material": glifo/sigilo material cuando no hay imagen propia.
type Props = {
  variant: "image" | "material";
  imageSrc?: string;
  glyph: string;
  alt: string;
  eyebrow?: string;
  title: string;
  meta?: string;
};

export default function AtlasSectionHero({
  variant,
  imageSrc,
  glyph,
  alt,
  eyebrow,
  title,
  meta,
}: Props) {
  const showImage = variant === "image" && Boolean(imageSrc);
  return (
    <div className="av2-section-hero" data-variant={showImage ? "image" : "material"}>
      <div className="av2-section-hero-rings" aria-hidden="true" />
      <div className="av2-section-hero-focus">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={alt} />
        ) : (
          <span aria-hidden="true">{glyph}</span>
        )}
      </div>
      <div className="av2-section-hero-caption">
        {eyebrow && <p>{eyebrow}</p>}
        <h2>{title}</h2>
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
}
