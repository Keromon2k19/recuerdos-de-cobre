import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  eyebrow?: string;
  title?: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
};

export default function AtlasNarrativeFrame({
  children,
  eyebrow,
  title,
  variant = "primary",
  className = "",
}: Props) {
  return (
    <section
      className={`av2-narrative-frame ${className}`.trim()}
      data-variant={variant}
    >
      {(eyebrow || title) && (
        <header className="av2-narrative-frame-head">
          {eyebrow && <p>{eyebrow}</p>}
          {title && <h2>{title}</h2>}
        </header>
      )}
      <div className="av2-narrative-frame-body">{children}</div>
    </section>
  );
}
