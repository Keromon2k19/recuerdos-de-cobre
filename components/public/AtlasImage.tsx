// components/public/AtlasImage.tsx — Imagen atmosférica con espacio
// reservado por el contenedor (aspect-ratio en CSS) y fallback a
// placeholder. Una sola pieza para hero, portadas, retratos y miniaturas.

import type { ResolvedImage } from "@/lib/images";

export default function AtlasImage({
  img,
  priority = false,
}: {
  img: ResolvedImage;
  priority?: boolean;
}) {
  if (img.kind === "img") {
    return (
      <img
        src={img.src}
        alt={img.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }
  // Placeholder decorativo: el nombre siempre está en texto adyacente
  // (h1/h3/aria-label del link), así que no se anuncia dos veces.
  return <div className="ph" data-glyph={img.glyph} aria-hidden="true" />;
}
