// Fondo inmersivo reusable para rutas /v2.
// Imagen fija a viewport con veil cobrizo encima. No depende del scroll.
// Server component — sin estado, sin "use client".

type Props = {
  src: string;
  blur?: number;
  intensity?: "soft" | "normal" | "strong";
  position?: string;
};

export default function PageImmersiveBackground({
  src,
  blur = 0,
  intensity = "normal",
  position = "center 35%",
}: Props) {
  const imgStyle: React.CSSProperties = {
    objectPosition: position,
    ...(blur > 0 ? { filter: `blur(${blur}px) saturate(0.85)` } : {}),
  };

  return (
    <div
      className={`av2-immersive-bg av2-immersive-bg--${intensity}`}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="av2-immersive-bg-img"
        style={imgStyle}
      />
      <div className="av2-immersive-bg-veil" />
    </div>
  );
}
