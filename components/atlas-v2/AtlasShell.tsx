// components/atlas-v2/AtlasShell.tsx — Wrapper raíz de V2.
// Inyecta la capa de engranajes decorativos como SVG server-rendered.
// No necesita "use client" — los engranajes son estáticos + animados por CSS.

function gearPath(
  cx: number,
  cy: number,
  R: number,
  r: number,
  hole: number,
  N: number
): string {
  const pts: [number, number][] = [];
  const tau = Math.PI * 2;
  const step = tau / N;

  for (let i = 0; i < N; i++) {
    const base = step * i - Math.PI / 2;
    const va = step * 0.27;
    const ta = step * 0.21;

    pts.push(
      [cx + r * Math.cos(base - va),       cy + r * Math.sin(base - va)],
      [cx + r * Math.cos(base - ta),       cy + r * Math.sin(base - ta)],
      [cx + R * Math.cos(base - ta * 0.5), cy + R * Math.sin(base - ta * 0.5)],
      [cx + R * Math.cos(base + ta * 0.5), cy + R * Math.sin(base + ta * 0.5)],
      [cx + r * Math.cos(base + ta),       cy + r * Math.sin(base + ta)],
    );
  }

  const body =
    "M" +
    pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") +
    "Z";

  if (hole <= 0) return body;

  const h = hole;
  const holePart = `M${(cx + h).toFixed(1)} ${cy.toFixed(1)}A${h} ${h} 0 1 0 ${(cx - h).toFixed(1)} ${cy.toFixed(1)}A${h} ${h} 0 1 0 ${(cx + h).toFixed(1)} ${cy.toFixed(1)}Z`;

  return `${body} ${holePart}`;
}

function spokePaths(
  cx: number,
  cy: number,
  ri: number,
  ro: number,
  N: number
): string {
  return Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    const x1 = cx + ri * Math.cos(a);
    const y1 = cy + ri * Math.sin(a);
    const x2 = cx + ro * Math.cos(a);
    const y2 = cy + ro * Math.sin(a);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }).join("");
}

function Gear({
  size,
  teeth,
  R,
  r,
  hole,
}: {
  size: number;
  teeth: number;
  R: number;
  r: number;
  hole: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const spokeRi = hole * 1.25;
  const spokeRo = r * 0.75;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={gearPath(cx, cy, R, r, hole, teeth)} fillRule="evenodd" />
      <path
        d={spokePaths(cx, cy, spokeRi, spokeRo, 6)}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.6"
      />
    </svg>
  );
}

export default function AtlasShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="av2">
      {/* Engranajes decorativos — fijos, detrás del contenido */}
      <div className="av2-gear-layer" aria-hidden="true">
        <div className="av2-gear-wrap av2-gear-wrap--left">
          <Gear size={380} teeth={14} R={155} r={126} hole={40} />
        </div>
        <div className="av2-gear-wrap av2-gear-wrap--right">
          <Gear size={290} teeth={12} R={118} r={96} hole={32} />
        </div>
        <div className="av2-gear-wrap av2-gear-wrap--right-sm">
          <Gear size={155} teeth={10} R={62} r={50} hole={16} />
        </div>
      </div>

      <div className="av2-shell">{children}</div>
    </div>
  );
}
