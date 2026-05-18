// components/SectionHead.tsx — Encabezado de sección del códice (sistema rdc).
// Eyebrow mono + título display + sub italic + meta. Sin glifo decorativo.

import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  sub?: string;
  meta?: ReactNode;
};

export default function SectionHead({ eyebrow, title, sub, meta }: Props) {
  return (
    <header className="rdc-section-head">
      <div className="rdc-eyebrow">
        <span>{eyebrow}</span>
      </div>
      <h2 className="rdc-section-title">{title}</h2>
      {sub ? <p className="rdc-section-sub">{sub}</p> : null}
      {meta != null ? <div className="rdc-section-meta">{meta}</div> : null}
    </header>
  );
}
